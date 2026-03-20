import * as Phaser from "phaser";
import type { MatchSnapshot, PlayerInput } from "../../../shared/types";
import { resolveCharacterIdForPlayer } from "../../../shared/constants/characters";
import {
  buildCharacterSpriteRootClassnames,
  getCharacterSpriteInnerHtml,
} from "../../../shared/ui/characterSpriteMarkup";
import { MATCH_TILE_PX } from "../offline/constants";
import { playMatchSfx, primeSfxContext } from "../audio/matchFeedbackSfx";
import { diffMatchFeedback } from "./matchFeedbackEvents";
import { applyTickFeedbackFx } from "./matchSceneFx";
import {
  BOMB_FILL,
  BOMB_STROKE,
  EXPLOSION_ALPHA,
  EXPLOSION_FILL,
  POWERUP_STROKE,
  VECINDAD_POWERUP_FILL,
  drawArenaBackdrop,
  drawVecindadGridCell,
} from "./vecindadArenaTheme";

const TILE_SIZE = MATCH_TILE_PX;

export interface MatchSceneData {
  getSnapshot: () => MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
}

interface SceneState {
  getSnapshot: () => MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
  backdropGraphics: Phaser.GameObjects.Graphics | null;
  gridGraphics: Phaser.GameObjects.Graphics | null;
  bombGraphics: Phaser.GameObjects.Graphics | null;
  playerSprites: Map<string, { dom: Phaser.GameObjects.DOMElement; targetX: number; targetY: number }>;
  lastSnapshotTick: number;
  feedbackPrevSnapshot: MatchSnapshot | null;
  sfxPrimed: boolean;
}

type MatchSceneConfig = Phaser.Types.Scenes.SettingsConfig & Phaser.Types.Scenes.CreateSceneFromObjectConfig;

export function getMatchSceneConfig(): MatchSceneConfig {
  const init: Phaser.Types.Scenes.SceneInitCallback = function (this: Phaser.Scene, data: unknown) {
    const d = data as MatchSceneData;
    const state: SceneState = {
      getSnapshot: typeof d?.getSnapshot === "function" ? d.getSnapshot : () => null,
      onInput: typeof d?.onInput === "function" ? d.onInput : () => {},
      backdropGraphics: null,
      gridGraphics: null,
      bombGraphics: null,
      playerSprites: new Map(),
      lastSnapshotTick: -1,
      feedbackPrevSnapshot: null,
      sfxPrimed: false,
    };
    (this as unknown as { _state: SceneState })._state = state;
  };
  return {
    key: "Match",
    active: true,
    init,
    create(this: Phaser.Scene) {
      const state = (this as unknown as { _state: SceneState })._state;
      state.backdropGraphics = this.add.graphics();
      state.backdropGraphics.setDepth(-10);
      drawArenaBackdrop(this, state.backdropGraphics);
      state.gridGraphics = this.add.graphics();
      state.gridGraphics.setDepth(0);
      state.bombGraphics = this.add.graphics();
      state.bombGraphics.setDepth(1);
      drawGrid(this, state);
      drawPlayers(this, state);
      setupKeys(this, state);
    },
    update(this: Phaser.Scene) {
      const state = (this as unknown as { _state: SceneState })._state;
      const snapshot = state.getSnapshot();
      if (!snapshot) return;
      if (snapshot.status === "ended") {
        if (snapshot.tick !== state.lastSnapshotTick) {
          const diff = diffMatchFeedback(state.feedbackPrevSnapshot, snapshot);
          if (diff.newBombCenters.length > 0) playMatchSfx("bomb_place");
          if (diff.hasNewExplosions) playMatchSfx("explosion");
          applyTickFeedbackFx(this, diff.newBombCenters, diff.newExplosionCells, TILE_SIZE / 2, TILE_SIZE);
          state.feedbackPrevSnapshot = snapshot;
          state.lastSnapshotTick = snapshot.tick;
          drawGrid(this, state);
          drawBombsAndExplosions(this, state);
          drawPlayers(this, state);
        }
        return;
      }
      if (snapshot.tick !== state.lastSnapshotTick) {
        const diff = diffMatchFeedback(state.feedbackPrevSnapshot, snapshot);
        if (diff.newBombCenters.length > 0) playMatchSfx("bomb_place");
        if (diff.hasNewExplosions) playMatchSfx("explosion");
        applyTickFeedbackFx(this, diff.newBombCenters, diff.newExplosionCells, TILE_SIZE / 2, TILE_SIZE);
        state.feedbackPrevSnapshot = snapshot;
        state.lastSnapshotTick = snapshot.tick;
        drawGrid(this, state);
        drawBombsAndExplosions(this, state);
        drawPlayers(this, state);
      }
      const half = TILE_SIZE / 2;
      for (const p of snapshot.players ?? []) {
        const entry = state.playerSprites.get(p.id);
        if (entry) {
          entry.targetX = p.x * TILE_SIZE + half;
          entry.targetY = p.y * TILE_SIZE + half;
          entry.dom.setVisible(true);
          entry.dom.setAlpha(p.alive ? 1 : 0.55);
          const el = entry.dom.node as HTMLElement;
          el.classList.toggle("detonadores-char--dead", !p.alive);
          const idx = playerIndexFromId(p.id);
          el.setAttribute("data-character-id", resolveCharacterIdForPlayer(p.characterId, idx));
        }
      }
      const LERP = 0.2;
      for (const [, { dom, targetX, targetY }] of state.playerSprites) {
        const dx = targetX - dom.x;
        const dy = targetY - dom.y;
        dom.setPosition(dom.x + dx * LERP, dom.y + dy * LERP);
      }
    },
  };
}

function setupKeys(scene: Phaser.Scene, state: SceneState) {
  const keys = scene.input.keyboard;
  if (!keys) return;
  const keyMap: Record<number, PlayerInput> = {
    [Phaser.Input.Keyboard.KeyCodes.UP]: "up",
    [Phaser.Input.Keyboard.KeyCodes.DOWN]: "down",
    [Phaser.Input.Keyboard.KeyCodes.LEFT]: "left",
    [Phaser.Input.Keyboard.KeyCodes.RIGHT]: "right",
    [Phaser.Input.Keyboard.KeyCodes.W]: "up",
    [Phaser.Input.Keyboard.KeyCodes.S]: "down",
    [Phaser.Input.Keyboard.KeyCodes.A]: "left",
    [Phaser.Input.Keyboard.KeyCodes.D]: "right",
    [Phaser.Input.Keyboard.KeyCodes.SPACE]: "place_bomb",
  };
  for (const [code, input] of Object.entries(keyMap)) {
    const key = keys.addKey(Number(code));
    key?.on("down", () => {
      if (!state.sfxPrimed) {
        state.sfxPrimed = true;
        primeSfxContext();
      }
      state.onInput(input);
    });
  }
}

function drawGrid(scene: Phaser.Scene, state: SceneState) {
  const snapshot = state.getSnapshot();
  const g = state.gridGraphics!;
  g.clear();
  if (!snapshot?.grid?.length) return;
  const grid = snapshot.grid;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!;
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!;
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      drawVecindadGridCell(g, px, py, x, y, cell.type);
    }
  }
}

function drawBombsAndExplosions(scene: Phaser.Scene, state: SceneState) {
  const snapshot = state.getSnapshot();
  const g = state.bombGraphics!;
  g.clear();
  if (!snapshot) return;
  const half = TILE_SIZE / 2;
  for (const bomb of snapshot.bombs ?? []) {
    const px = bomb.x * TILE_SIZE + half;
    const py = bomb.y * TILE_SIZE + half;
    g.fillStyle(BOMB_FILL, 1);
    g.fillCircle(px, py, 16);
    g.lineStyle(2, BOMB_STROKE);
    g.strokeCircle(px, py, 16);
  }
  const expR = TILE_SIZE / 2 - 2;
  for (const exp of snapshot.explosions ?? []) {
    const px = exp.x * TILE_SIZE + half;
    const py = exp.y * TILE_SIZE + half;
    g.fillStyle(EXPLOSION_FILL, EXPLOSION_ALPHA);
    g.fillCircle(px, py, expR);
    g.lineStyle(2, 0xffe8d6, 0.9);
    g.strokeCircle(px, py, expR);
  }
  for (const pu of snapshot.powerups ?? []) {
    const px = pu.x * TILE_SIZE + half;
    const py = pu.y * TILE_SIZE + half;
    const color = VECINDAD_POWERUP_FILL[pu.type] ?? 0x9c8b7c;
    g.fillStyle(color, 1);
    g.fillCircle(px, py, 12);
    g.lineStyle(1, POWERUP_STROKE);
    g.strokeCircle(px, py, 12);
  }
}

function playerIndexFromId(id: string): number {
  const m = /^player-(\d+)$/.exec(id);
  return m ? Number(m[1]) : 0;
}

function drawPlayers(scene: Phaser.Scene, state: SceneState) {
  const snapshot = state.getSnapshot();
  if (!snapshot?.players?.length) {
    for (const id of Array.from(state.playerSprites.keys())) {
      const entry = state.playerSprites.get(id);
      entry?.dom.destroy();
      state.playerSprites.delete(id);
    }
    return;
  }
  const half = TILE_SIZE / 2;
  for (const p of snapshot.players) {
    const idx = playerIndexFromId(p.id);
    const charId = resolveCharacterIdForPlayer(p.characterId, idx);
    let entry = state.playerSprites.get(p.id);
    if (!entry) {
      const root = document.createElement("div");
      root.className = buildCharacterSpriteRootClassnames({
        size: "match",
        animate: true,
        dead: !p.alive,
      });
      root.setAttribute("data-character-id", charId);
      root.innerHTML = getCharacterSpriteInnerHtml();
      const targetX = p.x * TILE_SIZE + half;
      const targetY = p.y * TILE_SIZE + half;
      const dom = scene.add.dom(targetX, targetY, root);
      dom.setOrigin(0.5, 0.5);
      dom.setDepth(100);
      dom.setAlpha(p.alive ? 1 : 0.55);
      state.playerSprites.set(p.id, { dom, targetX, targetY });
      entry = state.playerSprites.get(p.id)!;
    }
    entry.targetX = p.x * TILE_SIZE + half;
    entry.targetY = p.y * TILE_SIZE + half;
    entry.dom.setVisible(true);
    entry.dom.setAlpha(p.alive ? 1 : 0.55);
    const el = entry.dom.node as HTMLElement;
    el.classList.toggle("detonadores-char--dead", !p.alive);
    el.setAttribute("data-character-id", charId);
  }
  for (const id of Array.from(state.playerSprites.keys())) {
    if (!snapshot.players.some((pl) => pl.id === id)) {
      const entry = state.playerSprites.get(id);
      entry?.dom.destroy();
      state.playerSprites.delete(id);
    }
  }
}

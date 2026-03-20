import * as Phaser from "phaser";
import type { MatchSnapshot, PlayerInput } from "../../../shared/types";

const TILE_SIZE = 48;

export interface MatchSceneData {
  getSnapshot: () => MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
}

interface SceneState {
  getSnapshot: () => MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
  gridGraphics: Phaser.GameObjects.Graphics | null;
  bombGraphics: Phaser.GameObjects.Graphics | null;
  playerSprites: Map<string, { g: Phaser.GameObjects.Graphics; targetX: number; targetY: number }>;
  lastSnapshotTick: number;
}

type MatchSceneConfig = Phaser.Types.Scenes.SettingsConfig & Phaser.Types.Scenes.CreateSceneFromObjectConfig;

export function getMatchSceneConfig(): MatchSceneConfig {
  const init: Phaser.Types.Scenes.SceneInitCallback = function (this: Phaser.Scene, data: unknown) {
    const d = data as MatchSceneData;
    const state: SceneState = {
      getSnapshot: typeof d?.getSnapshot === "function" ? d.getSnapshot : () => null,
      onInput: typeof d?.onInput === "function" ? d.onInput : () => {},
      gridGraphics: null,
      bombGraphics: null,
      playerSprites: new Map(),
      lastSnapshotTick: -1,
    };
    (this as unknown as { _state: SceneState })._state = state;
  };
  return {
    key: "Match",
    active: true,
    init,
    create(this: Phaser.Scene) {
      const state = (this as unknown as { _state: SceneState })._state;
      state.gridGraphics = this.add.graphics();
      state.bombGraphics = this.add.graphics();
      drawGrid(this, state);
      drawPlayers(this, state);
      setupKeys(this, state);
    },
    update(this: Phaser.Scene) {
      const state = (this as unknown as { _state: SceneState })._state;
      const snapshot = state.getSnapshot();
      if (!snapshot) return;
      if (snapshot.status === "ended") {
        // Draw final state once, then keep scene visually frozen.
        if (snapshot.tick !== state.lastSnapshotTick) {
          state.lastSnapshotTick = snapshot.tick;
          drawGrid(this, state);
          drawBombsAndExplosions(this, state);
          drawPlayers(this, state);
        }
        return;
      }
      if (snapshot.tick !== state.lastSnapshotTick) {
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
          entry.g.setVisible(true);
          entry.g.setAlpha(p.alive ? 1 : 0.55);
        }
      }
      const LERP = 0.2;
      for (const [, { g, targetX, targetY }] of state.playerSprites) {
        const dx = targetX - g.x;
        const dy = targetY - g.y;
        g.setPosition(g.x + dx * LERP, g.y + dy * LERP);
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
    key?.on("down", () => state.onInput(input));
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
      if (cell.type === "floor") {
        g.fillStyle(0x4a5568, 1);
        g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2d3748);
        g.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (cell.type === "hard_block") {
        g.fillStyle(0x2d3748, 1);
        g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        g.lineStyle(2, 0x1a202c);
        g.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (cell.type === "soft_block") {
        g.fillStyle(0x805ad5, 0.9);
        g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x6b46c1);
        g.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (cell.type === "collapsed") {
        g.fillStyle(0x1a202c, 1);
        g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x0d1117);
        g.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

const POWERUP_COLORS: Record<string, number> = {
  bomb_capacity: 0x1a202c,
  flame_range: 0xe53e3e,
  speed: 0x3182ce,
  shield: 0x38a169,
  special: 0x805ad5,
};

function drawBombsAndExplosions(scene: Phaser.Scene, state: SceneState) {
  const snapshot = state.getSnapshot();
  const g = state.bombGraphics!;
  g.clear();
  if (!snapshot) return;
  const half = TILE_SIZE / 2;
  for (const bomb of snapshot.bombs ?? []) {
    const px = bomb.x * TILE_SIZE + half;
    const py = bomb.y * TILE_SIZE + half;
    g.fillStyle(0x1a202c, 1);
    g.fillCircle(px, py, 16);
    g.lineStyle(2, 0x4a5568);
    g.strokeCircle(px, py, 16);
  }
  for (const exp of snapshot.explosions ?? []) {
    const px = exp.x * TILE_SIZE + half;
    const py = exp.y * TILE_SIZE + half;
    g.fillStyle(0xe53e3e, 0.6);
    g.fillCircle(px, py, TILE_SIZE / 2 - 2);
  }
  for (const pu of snapshot.powerups ?? []) {
    const px = pu.x * TILE_SIZE + half;
    const py = pu.y * TILE_SIZE + half;
    const color = POWERUP_COLORS[pu.type] ?? 0x718096;
    g.fillStyle(color, 1);
    g.fillCircle(px, py, 12);
    g.lineStyle(1, 0x2d3748);
    g.strokeCircle(px, py, 12);
  }
}

function drawPlayers(scene: Phaser.Scene, state: SceneState) {
  const snapshot = state.getSnapshot();
  if (!snapshot?.players?.length) return;
  const half = TILE_SIZE / 2;
  for (const p of snapshot.players) {
    let entry = state.playerSprites.get(p.id);
    if (!entry) {
      const g = scene.add.graphics();
      const targetX = p.x * TILE_SIZE + half;
      const targetY = p.y * TILE_SIZE + half;
      g.setPosition(targetX, targetY);
      g.setAlpha(p.alive ? 1 : 0.55);
      if (p.alive) {
        g.fillStyle(0x48bb78, 1);
        g.fillCircle(0, 0, 14);
      } else {
        g.fillStyle(0x4a5568, 0.95);
        g.fillCircle(0, 0, 14);
        g.lineStyle(2, 0xe53e3e, 0.9);
        g.strokeCircle(0, 0, 14);
      }
      state.playerSprites.set(p.id, { g, targetX, targetY });
      entry = state.playerSprites.get(p.id)!;
    }
    entry.targetX = p.x * TILE_SIZE + half;
    entry.targetY = p.y * TILE_SIZE + half;
    entry.g.setVisible(true);
    entry.g.setAlpha(p.alive ? 1 : 0.55);
    entry.g.clear();
    if (p.alive) {
      entry.g.fillStyle(0x48bb78, 1);
      entry.g.fillCircle(0, 0, 14);
    } else {
      entry.g.fillStyle(0x4a5568, 0.95);
      entry.g.fillCircle(0, 0, 14);
      entry.g.lineStyle(2, 0xe53e3e, 0.9);
      entry.g.strokeCircle(0, 0, 14);
    }
  }
  for (const id of Array.from(state.playerSprites.keys())) {
    if (!snapshot.players.some((p) => p.id === id)) {
      const entry = state.playerSprites.get(id);
      entry?.g.destroy();
      state.playerSprites.delete(id);
    }
  }
}

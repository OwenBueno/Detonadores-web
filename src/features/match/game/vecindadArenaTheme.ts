import type * as Phaser from "phaser";
import { MATCH_TILE_PX } from "../offline/constants";

/** Phaser.GameConfig.backgroundColor */
export const ARENA_SCENE_BACKGROUND = "#5c4d42";

const S = MATCH_TILE_PX;

/** Powerup tints — kept distinct; special avoids old soft-block purple confusion. */
export const VECINDAD_POWERUP_FILL: Record<string, number> = {
  bomb_capacity: 0x2d2520,
  flame_range: 0xe85d4c,
  speed: 0x3d9ee8,
  shield: 0x3dad6a,
  special: 0xc06bb5,
};

export const BOMB_FILL = 0x1e1814;
export const BOMB_STROKE = 0xf0a030;
export const EXPLOSION_FILL = 0xff5c3a;
export const EXPLOSION_ALPHA = 0.62;
export const POWERUP_STROKE = 0x2a2018;

const FLOOR_A = 0xd8c8b8;
const FLOOR_B = 0xc8b8a8;
const FLOOR_MORTAR = 0xa89888;

const HARD_BASE = 0x9c7a5c;
const HARD_BAND = 0x7a5c44;
const HARD_OUTLINE = 0x4a3828;
const HARD_SILL = 0xd4c4b0;

const SOFT_BASE = 0xc4956a;
const SOFT_PLANK = 0xa67b52;
const SOFT_TAPE = 0xe8d8c8;
const SOFT_OUTLINE = 0x6b4a32;

const COLLAPSED_BASE = 0x2e2824;
const COLLAPSED_RUBBLE = 0x504840;
const COLLAPSED_OUTLINE = 0x1a1512;

const BACKDROP_BASE = 0x5c4d42;
const BACKDROP_SKY = 0x6b5a4a;

type G = Phaser.GameObjects.Graphics;

export function drawArenaBackdrop(scene: Phaser.Scene, g: G): void {
  g.clear();
  const w = scene.scale.width;
  const h = scene.scale.height;
  g.fillStyle(BACKDROP_BASE, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(BACKDROP_SKY, 0.4);
  g.fillRect(0, 0, w, Math.min(h * 0.22, S * 2.5));
}

export function drawVecindadFloorTile(g: G, px: number, py: number, gx: number, gy: number): void {
  const sub = 8;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const checker = (i + j + gx + gy) % 2 === 0;
      g.fillStyle(checker ? FLOOR_A : FLOOR_B, 1);
      g.fillRect(px + i * sub, py + j * sub, sub, sub);
    }
  }
  g.lineStyle(1, FLOOR_MORTAR, 0.85);
  g.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
}

export function drawVecindadHardTile(g: G, px: number, py: number, gx: number, gy: number): void {
  g.fillStyle(HARD_BASE, 1);
  g.fillRect(px, py, S, S);
  const band = 6;
  for (let x = 0; x < S; x += band) {
    g.fillStyle((x / band + gx) % 2 === 0 ? HARD_BAND : HARD_BASE, 1);
    g.fillRect(px + x, py, Math.min(band, S - x), S);
  }
  g.lineStyle(2, HARD_OUTLINE, 1);
  g.strokeRect(px + 1, py + 1, S - 2, S - 2);
  if ((gx + gy * 3) % 5 === 0) {
    g.fillStyle(HARD_SILL, 1);
    g.fillRect(px + 10, py + 6, 28, 8);
    g.fillStyle(HARD_OUTLINE, 1);
    g.fillRect(px + 14, py + 8, 8, 4);
  }
}

export function drawVecindadSoftTile(g: G, px: number, py: number, gx: number, gy: number): void {
  g.fillStyle(SOFT_BASE, 1);
  g.fillRect(px, py, S, S);
  const plank = 8;
  for (let y = 0; y < S; y += plank) {
    g.fillStyle((y / plank + gx + gy) % 2 === 0 ? SOFT_PLANK : SOFT_BASE, 1);
    g.fillRect(px, py + y, S, Math.min(plank, S - y));
  }
  g.lineStyle(2, SOFT_TAPE, 0.9);
  g.strokeRect(px + 4, py + 4, S - 8, S - 8);
  g.lineStyle(2, SOFT_OUTLINE, 1);
  g.strokeRect(px + 1, py + 1, S - 2, S - 2);
}

export function drawVecindadCollapsedTile(g: G, px: number, py: number, gx: number, gy: number): void {
  g.fillStyle(COLLAPSED_BASE, 1);
  g.fillRect(px, py, S, S);
  const sub = 12;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if ((i * 3 + j + gx + gy) % 5 !== 0) {
        g.fillStyle(COLLAPSED_RUBBLE, 1);
        g.fillRect(px + i * sub + 2, py + j * sub + 2, sub - 4, sub - 4);
      }
    }
  }
  g.lineStyle(1, COLLAPSED_OUTLINE, 1);
  g.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
}

export function drawVecindadGridCell(
  g: G,
  px: number,
  py: number,
  gx: number,
  gy: number,
  type: string
): void {
  switch (type) {
    case "floor":
      drawVecindadFloorTile(g, px, py, gx, gy);
      break;
    case "hard_block":
      drawVecindadHardTile(g, px, py, gx, gy);
      break;
    case "soft_block":
      drawVecindadSoftTile(g, px, py, gx, gy);
      break;
    case "collapsed":
      drawVecindadCollapsedTile(g, px, py, gx, gy);
      break;
    default:
      drawVecindadFloorTile(g, px, py, gx, gy);
  }
}

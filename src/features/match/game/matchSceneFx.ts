import * as Phaser from "phaser";
import { BOMB_STROKE } from "./vecindadArenaTheme";

const MAX_BOMB_PULSES = 6;
const MAX_EXPLOSION_FLASHES = 14;

/**
 * Use Arc (vector) objects, not Graphics: Graphics stroke geometry often ignores
 * scale/alpha tweens correctly on WebGL, so the bomb “pulse” was invisible.
 */
export function spawnBombPulse(scene: Phaser.Scene, cx: number, cy: number): void {
  const ring = scene.add.circle(cx, cy, 18, 0x000000, 0);
  ring.setStrokeStyle(3, BOMB_STROKE);
  ring.setDepth(5);
  ring.setAlpha(1);
  scene.tweens.add({
    targets: ring,
    scaleX: 1.35,
    scaleY: 1.35,
    alpha: 0,
    duration: 220,
    ease: "Cubic.Out",
    onComplete: () => ring.destroy(),
  });
}

export function spawnExplosionFlash(scene: Phaser.Scene, cx: number, cy: number, radius: number): void {
  const ring = scene.add.circle(cx, cy, radius, 0x000000, 0);
  ring.setStrokeStyle(2, 0xfff5e6);
  ring.setDepth(5);
  ring.setAlpha(0.95);
  scene.tweens.add({
    targets: ring,
    scaleX: 1.08,
    scaleY: 1.08,
    alpha: 0,
    duration: 170,
    ease: "Power2",
    onComplete: () => ring.destroy(),
  });
}

export function applyTickFeedbackFx(
  scene: Phaser.Scene,
  newBombs: { x: number; y: number }[],
  newExplosions: { x: number; y: number }[],
  tileHalf: number,
  tileSize: number
): void {
  const br = newBombs.slice(0, MAX_BOMB_PULSES);
  for (const b of br) {
    spawnBombPulse(scene, b.x * tileSize + tileHalf, b.y * tileSize + tileHalf);
  }
  const er = newExplosions.slice(0, MAX_EXPLOSION_FLASHES);
  const expR = tileSize / 2 - 2;
  for (const e of er) {
    spawnExplosionFlash(scene, e.x * tileSize + tileHalf, e.y * tileSize + tileHalf, expR);
  }
}

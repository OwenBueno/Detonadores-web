import type { MatchSnapshot } from "../../../shared/types";

export type MatchFeedbackDiff = {
  newBombCenters: { x: number; y: number }[];
  newExplosionCells: { x: number; y: number }[];
  /** At least one new explosion cell this tick (debounce SFX). */
  hasNewExplosions: boolean;
  becameEnded: boolean;
};

function explosionKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Compares two authoritative snapshots after a tick advance (or first ended frame).
 * Call only when `curr.tick !== prev?.tick` or status flips to ended.
 */
export function diffMatchFeedback(
  prev: MatchSnapshot | null,
  curr: MatchSnapshot | null
): MatchFeedbackDiff {
  const empty: MatchFeedbackDiff = {
    newBombCenters: [],
    newExplosionCells: [],
    hasNewExplosions: false,
    becameEnded: false,
  };
  if (!curr) return empty;

  const becameEnded = prev?.status !== "ended" && curr.status === "ended";

  if (!prev || prev.tick > curr.tick) {
    return { ...empty, becameEnded };
  }

  if (prev.tick === curr.tick) {
    return { ...empty, becameEnded };
  }

  const prevBombIds = new Set((prev.bombs ?? []).map((b) => b.id));
  const newBombCenters = (curr.bombs ?? [])
    .filter((b) => !prevBombIds.has(b.id))
    .map((b) => ({ x: b.x, y: b.y }));

  const prevExp = new Set((prev.explosions ?? []).map((e) => explosionKey(e.x, e.y)));
  const newExplosionCells = (curr.explosions ?? [])
    .filter((e) => !prevExp.has(explosionKey(e.x, e.y)))
    .map((e) => ({ x: e.x, y: e.y }));

  return {
    newBombCenters,
    newExplosionCells,
    hasNewExplosions: newExplosionCells.length > 0,
    becameEnded,
  };
}

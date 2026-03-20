import type { MatchSnapshot, PlayerState } from "../../../shared/types/match";

export const TICK_MS = 50;
export const RECONCILE_SNAP_THRESHOLD_TILES = 0.5;

let prevSnapshot: MatchSnapshot | null = null;
let currentSnapshot: MatchSnapshot | null = null;
let prevReceivedAt = 0;
let currentReceivedAt = 0;

export function pushSnapshot(snapshot: MatchSnapshot): void {
  const now = Date.now();
  if (currentSnapshot === null) {
    prevSnapshot = snapshot;
    currentSnapshot = snapshot;
    prevReceivedAt = now;
    currentReceivedAt = now;
    return;
  }
  prevSnapshot = currentSnapshot;
  prevReceivedAt = currentReceivedAt;
  currentSnapshot = snapshot;
  currentReceivedAt = now;
}

function interpolatePlayer(
  prev: PlayerState,
  curr: PlayerState,
  alpha: number
): { x: number; y: number } {
  const x = prev.x + (curr.x - prev.x) * alpha;
  const y = prev.y + (curr.y - prev.y) * alpha;
  const dist = Math.sqrt((curr.x - x) ** 2 + (curr.y - y) ** 2);
  if (dist > RECONCILE_SNAP_THRESHOLD_TILES) {
    return { x: curr.x, y: curr.y };
  }
  return { x, y };
}

export function getDisplaySnapshot(): MatchSnapshot | null {
  if (currentSnapshot === null) return null;
  if (prevSnapshot === null || prevSnapshot.tick === currentSnapshot.tick) {
    return currentSnapshot;
  }
  const now = Date.now();
  const elapsed = currentReceivedAt - prevReceivedAt;
  const alpha = elapsed <= 0 ? 1 : Math.min(1, Math.max(0, (now - prevReceivedAt) / elapsed));

  const players: PlayerState[] = currentSnapshot.players.map((curr) => {
    const prev = prevSnapshot!.players.find((p) => p.id === curr.id);
    const base = { ...curr };
    if (prev && prev.alive && curr.alive) {
      const { x, y } = interpolatePlayer(prev, curr, alpha);
      base.x = x;
      base.y = y;
    }
    return base;
  });

  return {
    ...currentSnapshot,
    players,
  };
}

export function getLatestSnapshot(): MatchSnapshot | null {
  return currentSnapshot;
}

export function clearSnapshotBuffer(): void {
  prevSnapshot = null;
  currentSnapshot = null;
  prevReceivedAt = 0;
  currentReceivedAt = 0;
}

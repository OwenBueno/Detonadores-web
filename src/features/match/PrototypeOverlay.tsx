"use client";

import type { MatchSnapshot } from "../../shared/types";

export interface PrototypeOverlayProps {
  snapshot: MatchSnapshot | null;
  onRestart: () => void;
}

export function PrototypeOverlay({ snapshot, onRestart }: PrototypeOverlayProps) {
  if (!snapshot) return null;
  const p0 = snapshot.players?.find((p) => p.id === "player-0");
  return (
    <div
      className="absolute left-3 top-3 z-10 rounded bg-black/70 px-3 py-2 font-mono text-sm text-white"
      aria-label="Prototype dev overlay"
    >
      <div>Status: {snapshot.status}</div>
      <div>Tick: {snapshot.tick}</div>
      {snapshot.tick >= 3600 && (
        <div className="text-amber-400">Sudden death</div>
      )}
      {p0 != null && (
        <div className="mt-1 space-y-0.5">
          <div>Bombs: {p0.bombs}</div>
          <div>Range: {p0.range}</div>
          <div>Speed: {p0.speed ?? 1}</div>
          <div>Shield: {p0.shieldActive ? "yes" : "no"}</div>
        </div>
      )}
      {snapshot.players?.some((p) => p.reconnectPending) && (
        <div className="mt-1 text-amber-300">
          Reconnecting:{" "}
          {snapshot.players
            .filter((p) => p.reconnectPending)
            .map((p) => p.id)
            .join(", ")}
        </div>
      )}
      {snapshot.status === "ended" && (
        <div>Winner: {snapshot.winnerId ?? "Draw"}</div>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="mt-2 rounded bg-white/20 px-2 py-1 hover:bg-white/30"
      >
        Restart
      </button>
    </div>
  );
}

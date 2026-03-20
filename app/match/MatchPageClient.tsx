"use client";

import { useEffect, useMemo, useState } from "react";
import { PhaserMatchView, PrototypeOverlay, useOfflineEngine, useOnlineMatch } from "../../src/features/match";

export default function MatchPageClient() {
  const [mode, setMode] = useState<"offline" | "online">("offline");
  const offline = useOfflineEngine();
  const online = useOnlineMatch();
  const snapshot = mode === "online" ? online.snapshot : offline.snapshot;
  const getSnapshot =
    mode === "online" ? online.getSnapshot : () => offline.snapshot;
  const onInput = mode === "online" ? online.onInput : offline.onInput;
  const restart = mode === "online" ? online.restart : offline.restart;
  const statusLine = useMemo(() => {
    if (mode !== "online") return null;
    if (online.ended) {
      if (online.winnerId) return `Match ended. Winner: ${online.winnerId}`;
      return "Match ended. Draw.";
    }
    if (online.lastError) return `WS error: ${online.lastError}`;
    return online.connected ? "WS connected" : "WS connecting...";
  }, [mode, online.connected, online.lastError, online.ended, online.winnerId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [restart]);

  return (
    <main className="relative flex h-screen w-full flex-col">
      <div className="absolute right-3 top-3 z-10 rounded bg-black/70 px-3 py-2 font-mono text-sm text-white">
        <div className="flex items-center gap-2">
          <span>Mode:</span>
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "offline" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
            onClick={() => setMode("offline")}
          >
            Offline
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "online" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
            onClick={() => setMode("online")}
          >
            Online
          </button>
        </div>
        {statusLine && <div className="mt-1 text-xs text-white/80">{statusLine}</div>}
      </div>
      <PrototypeOverlay snapshot={snapshot} onRestart={restart} />
      <PhaserMatchView snapshot={snapshot} getSnapshot={getSnapshot} onInput={onInput} />
    </main>
  );
}

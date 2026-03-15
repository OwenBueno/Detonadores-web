"use client";

import { useEffect } from "react";
import { PhaserMatchView, PrototypeOverlay, useOfflineEngine } from "../../src/features/match";

export default function MatchPageClient() {
  const { snapshot, onInput, restart } = useOfflineEngine();

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
      <PrototypeOverlay snapshot={snapshot} onRestart={restart} />
      <PhaserMatchView snapshot={snapshot} onInput={onInput} />
    </main>
  );
}

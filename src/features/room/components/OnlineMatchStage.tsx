"use client";

import dynamic from "next/dynamic";
import type { MatchSnapshot, PlayerInput } from "@/src/shared/types";
import { PrototypeOverlay } from "@/src/features/match/PrototypeOverlay";

const PhaserMatchView = dynamic(
  () =>
    import("@/src/features/match/game/PhaserMatchView").then((m) => ({
      default: m.PhaserMatchView,
    })),
  { ssr: false }
);

type Props = {
  matchSnapshot: MatchSnapshot | null;
  matchGetSnapshot: () => MatchSnapshot | null;
  matchOnInput: (input: PlayerInput) => void;
};

export function OnlineMatchStage({
  matchSnapshot,
  matchGetSnapshot,
  matchOnInput,
}: Props) {
  return (
    <main className="relative flex h-screen w-full flex-col">
      <div className="absolute right-3 top-3 z-10 rounded bg-black/70 px-3 py-2 font-mono text-sm text-white">
        <p className="text-xs text-white/80">
          Room match — you will return to lobby when the match ends.
        </p>
      </div>
      <PrototypeOverlay snapshot={matchSnapshot} onRestart={() => {}} />
      <PhaserMatchView
        snapshot={matchSnapshot}
        getSnapshot={matchGetSnapshot}
        onInput={matchOnInput}
      />
    </main>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { MatchSnapshot, PlayerInput } from "@/src/shared/types";
import { MatchHud } from "@/src/features/match/components/MatchHud";

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
  localMatchPlayerId: string | null;
};

export function OnlineMatchStage({
  matchSnapshot,
  matchGetSnapshot,
  matchOnInput,
  localMatchPlayerId,
}: Props) {
  return (
    <main className="relative flex h-screen w-full flex-col">
      <div className="absolute right-3 top-3 z-10 rounded bg-black/70 px-3 py-2 font-mono text-sm text-white">
        <p className="text-xs text-white/80">
          Room match — you will return to lobby when the match ends.
        </p>
      </div>
      <MatchHud snapshot={matchSnapshot} localPlayerId={localMatchPlayerId} />
      <PhaserMatchView
        snapshot={matchSnapshot}
        getSnapshot={matchGetSnapshot}
        onInput={matchOnInput}
      />
    </main>
  );
}

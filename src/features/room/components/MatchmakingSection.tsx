type Props = {
  connected: boolean;
  hasRoom: boolean;
  matchmakingSearching: boolean;
  onMatchmakingJoin: () => void;
  onMatchmakingLeave: () => void;
};

export function MatchmakingSection({
  connected,
  hasRoom,
  matchmakingSearching,
  onMatchmakingJoin,
  onMatchmakingLeave,
}: Props) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-sm font-medium text-zinc-400">Matchmaking</h2>
      <p className="mb-2 text-xs text-zinc-500">
        Queue with other players (2–4 per match). You&apos;ll enter a lobby when a group is found.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onMatchmakingJoin}
          disabled={!connected || hasRoom || matchmakingSearching}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-sky-900/60"
        >
          {matchmakingSearching ? "Searching…" : "Find match"}
        </button>
        <button
          type="button"
          onClick={onMatchmakingLeave}
          disabled={!connected || !matchmakingSearching}
          className="rounded border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel search
        </button>
      </div>
    </section>
  );
}

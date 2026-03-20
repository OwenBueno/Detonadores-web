type Props = {
  matchWinnerId: string | null;
  onBackToRooms: () => void;
};

export function MatchEndScreen({ matchWinnerId, onBackToRooms }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-800/95 p-8 text-center shadow-2xl">
        <h2 className="mb-2 text-xl font-semibold text-zinc-100">Match finished</h2>
        <p className="mb-6 text-zinc-300">
          {matchWinnerId ? `Winner: ${matchWinnerId}` : "Draw — no winner"}
        </p>
        <button
          type="button"
          onClick={onBackToRooms}
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
        >
          Back to rooms
        </button>
      </div>
    </main>
  );
}

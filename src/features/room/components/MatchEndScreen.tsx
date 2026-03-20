"use client";

function matchPlayerLabel(id: string): string {
  const m = /^player-(\d+)$/.exec(id);
  if (m) return `Player ${Number(m[1]) + 1}`;
  return id;
}

type Props = {
  matchWinnerId: string | null;
  resultsLocalPlayerId: string | null;
  onBackToLobby: () => void;
  onPlayAgain: () => void;
  onNewRoom: () => void;
  onGoToDashboard: () => void;
};

export function MatchEndScreen({
  matchWinnerId,
  resultsLocalPlayerId,
  onBackToLobby,
  onPlayAgain,
  onNewRoom,
  onGoToDashboard,
}: Props) {
  const draw = !matchWinnerId;
  const youWon =
    !draw &&
    !!resultsLocalPlayerId &&
    matchWinnerId === resultsLocalPlayerId;
  const youLost =
    !draw &&
    !!resultsLocalPlayerId &&
    matchWinnerId !== resultsLocalPlayerId;

  let perspective: string | null = null;
  if (!draw) {
    if (youWon) perspective = "You won.";
    else if (youLost) perspective = "You were eliminated.";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-800/95 p-8 text-center shadow-2xl">
        <h2 className="mb-1 text-xl font-semibold text-zinc-100">Match complete</h2>
        <p className="mb-4 text-sm text-zinc-400">
          This room closed after the game. Start a new match from the lobby, matchmaking, or your
          dashboard.
        </p>
        <div className="mb-6 space-y-2">
          {draw ? (
            <p className="text-lg font-medium text-zinc-200">Draw — no winner</p>
          ) : (
            <>
              <p className="text-lg font-medium text-zinc-200">
                Winner:{" "}
                <span className="text-emerald-400">{matchPlayerLabel(matchWinnerId!)}</span>
                <span className="block text-sm font-normal text-zinc-500">({matchWinnerId})</span>
              </p>
              {perspective && <p className="text-sm text-zinc-300">{perspective}</p>}
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
          >
            Play again (matchmaking)
          </button>
          <button
            type="button"
            onClick={onNewRoom}
            className="rounded-lg border border-zinc-600 bg-zinc-700/50 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
          >
            New room
          </button>
          <button
            type="button"
            onClick={onGoToDashboard}
            className="rounded-lg border border-zinc-600 bg-zinc-700/50 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={onBackToLobby}
            className="mt-1 rounded-lg px-6 py-2.5 text-sm font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Back to lobby
          </button>
        </div>
      </div>
    </main>
  );
}

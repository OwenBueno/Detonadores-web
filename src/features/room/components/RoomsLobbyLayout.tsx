import type { ReactNode } from "react";

type Props = {
  connected: boolean;
  resumeReconnecting: boolean;
  error: string | null;
  showFooterHint: boolean;
  children: ReactNode;
};

export function RoomsLobbyLayout({
  connected,
  resumeReconnecting,
  error,
  showFooterHint,
  children,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 text-zinc-100 shadow-xl">
        <h1 className="mb-4 text-lg font-semibold">Rooms</h1>
        {!connected && (
          <p className="mb-2 text-sm text-zinc-400">Connecting to server…</p>
        )}
        {resumeReconnecting && connected && (
          <p className="mb-2 text-sm text-amber-400">Reconnecting to match…</p>
        )}
        {error && <p className="mb-2 text-sm text-red-400">Error: {error}</p>}
        {children}
        {showFooterHint && (
          <p className="mt-2 text-xs text-zinc-500">
            Find a match, create a room, or join by code / from the list.
          </p>
        )}
      </div>
    </main>
  );
}

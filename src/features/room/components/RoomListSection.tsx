import type { RoomSummary } from "../types";

type Props = {
  roomList: RoomSummary[];
  loadingList: boolean;
  onRefresh: () => void;
  connected: boolean;
  joining: boolean;
  onJoinRoom: (roomId: string) => void;
};

export function RoomListSection({
  roomList,
  loadingList,
  onRefresh,
  connected,
  joining,
  onJoinRoom,
}: Props) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Browse rooms</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loadingList}
          className="text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
        >
          {loadingList ? "Loading…" : "Refresh"}
        </button>
      </div>
      <ul className="space-y-2">
        {roomList.length === 0 && !loadingList && (
          <li className="text-xs text-zinc-500">No joinable rooms</li>
        )}
        {roomList.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm"
          >
            <span className="truncate font-mono text-xs text-zinc-300" title={r.id}>
              {r.name || r.id.slice(0, 8)}
            </span>
            <span className="text-zinc-500">
              {r.playerCount}/{r.maxPlayers}
            </span>
            <button
              type="button"
              onClick={() => onJoinRoom(r.id)}
              disabled={!connected || joining}
              className="rounded bg-zinc-600 px-2 py-1 text-xs font-medium hover:bg-zinc-500 disabled:opacity-50"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

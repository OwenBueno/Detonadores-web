import type { RoomStatePayload } from "@/src/shared/types";
import {
  CHARACTER_IDS,
  CHARACTER_LABELS,
  CHARACTER_TAGLINES,
  type CharacterId,
} from "@/src/shared/constants/characters";
import { CharacterSprite } from "@/src/shared/ui/CharacterSprite";
import { MAX_PLAYERS } from "../constants";

type Props = {
  room: RoomStatePayload;
  connected: boolean;
  takenCharacterIds: Set<string>;
  onSelectCharacter: (id: CharacterId) => void;
  onMarkReady: (ready: boolean) => void;
  canStart: boolean;
  starting: boolean;
  onStartMatch: () => void;
  onCopyRoomId: () => void;
};

export function RoomLobbyPanel({
  room,
  connected,
  takenCharacterIds,
  onSelectCharacter,
  onMarkReady,
  canStart,
  starting,
  onStartMatch,
  onCopyRoomId,
}: Props) {
  return (
    <div className="space-y-3 rounded border border-zinc-700 p-3 text-sm">
      <div>
        <span className="font-mono text-xs uppercase text-zinc-400">Room ID</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="break-all font-mono text-sm">{room.roomId}</span>
          <button
            type="button"
            onClick={onCopyRoomId}
            className="shrink-0 rounded bg-zinc-600 px-2 py-1 text-xs hover:bg-zinc-500"
          >
            Copy
          </button>
        </div>
      </div>
      <div>
        <span className="font-mono text-xs uppercase text-zinc-400">Status</span>
        <div className="mt-1 text-sm capitalize">{room.status}</div>
      </div>
      <div>
        <span className="font-mono text-xs uppercase text-zinc-400">
          Player slots ({room.players.length}/{MAX_PLAYERS})
        </span>
        <ul className="mt-1 space-y-1.5 text-sm">
          {Array.from({ length: MAX_PLAYERS }, (_, i) => {
            const player = room.players[i];
            return (
              <li
                key={i}
                className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2"
              >
                {player ? (
                  <>
                    <span className="truncate font-mono text-xs" title={player.id}>
                      {player.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {player.role === "host" ? "Host" : "Member"}
                      {player.characterId
                        ? ` · ${CHARACTER_LABELS[player.characterId as CharacterId] ?? player.characterId}`
                        : ""}
                      {" · "}
                      {player.ready ? "Ready" : "Not ready"}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-500">Empty slot</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <span className="font-mono text-xs uppercase text-zinc-400">
          Select your character
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHARACTER_IDS.map((id) => {
            const taken = takenCharacterIds.has(id);
            return (
              <button
                key={id}
                type="button"
                title={CHARACTER_TAGLINES[id]}
                onClick={() => onSelectCharacter(id)}
                disabled={!connected || taken}
                className="flex items-center gap-2 rounded border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:line-through"
              >
                <CharacterSprite id={id} size="sm" animate className="shrink-0" />
                <span className="text-left leading-tight">
                  {CHARACTER_LABELS[id]}
                  <span className="mt-0.5 block max-w-[10rem] text-[10px] font-normal text-zinc-400">
                    {CHARACTER_TAGLINES[id]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <span className="font-mono text-xs uppercase text-zinc-400">Ready</span>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onMarkReady(true)}
            disabled={!connected}
            className="rounded border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-600 disabled:opacity-50"
          >
            Mark ready
          </button>
          <button
            type="button"
            onClick={() => onMarkReady(false)}
            disabled={!connected}
            className="rounded border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-600 disabled:opacity-50"
          >
            Mark not ready
          </button>
        </div>
      </div>
      {canStart && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-emerald-400">
            All players ready ({room.players.length}/{room.players.length}).
          </p>
          <button
            type="button"
            onClick={onStartMatch}
            disabled={!connected || starting}
            className="rounded bg-amber-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-amber-700/60"
          >
            {starting ? "Starting…" : "Start match"}
          </button>
        </div>
      )}
    </div>
  );
}

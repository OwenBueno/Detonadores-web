"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ClientEvent,
  MatchSnapshot,
  PlayerInput,
  RoomStatePayload,
  ServerEvent,
} from "../../src/shared/types";
import { ERROR_CODES } from "../../src/shared/types";
import { createMatchWsClient } from "../../src/shared/lib";
import {
  CHARACTER_IDS,
  CHARACTER_LABELS,
  type CharacterId,
} from "../../src/shared/constants/characters";
import { PrototypeOverlay } from "../../src/features/match/PrototypeOverlay";
import {
  clearSnapshotBuffer,
  getDisplaySnapshot,
  getLatestSnapshot,
  pushSnapshot,
} from "../../src/features/match/lib/snapshotInterpolation";

const PhaserMatchView = dynamic(
  () =>
    import("../../src/features/match/game/PhaserMatchView").then((m) => ({
      default: m.PhaserMatchView,
    })),
  { ssr: false }
);

const MAX_PLAYERS = 4;
const MIN_PLAYERS_TO_START = 2;

function toClientEvent(input: PlayerInput): ClientEvent {
  if (input === "place_bomb") return { type: "match:place_bomb", payload: {} };
  return { type: "match:input", payload: { input } };
}

function errorMessageFromCode(code: string, message?: string): string {
  switch (code) {
    case ERROR_CODES.CHARACTER_TAKEN:
      return "That character is already taken";
    case ERROR_CODES.NOT_ALL_READY:
      return "Not all players are ready";
    case ERROR_CODES.MIN_PLAYERS_NOT_MET:
      return "Minimum players to start not met";
    case ERROR_CODES.ROOM_NOT_WAITING:
      return "Room is not waiting to start";
    default:
      return message ?? code ?? "Unknown error";
  }
}

interface RoomSummary {
  id: string;
  name?: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

function getBackendBaseUrl(): string {
  const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
  return `http://localhost:${port}`;
}

export default function RoomsPage() {
  const client = useMemo(() => createMatchWsClient(), []);
  const clientRef = useRef(client);
  clientRef.current = client;
  const roomRef = useRef<RoomStatePayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomStatePayload | null>(null);
  roomRef.current = room;
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [roomList, setRoomList] = useState<RoomSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [inMatch, setInMatch] = useState(false);
  const [matchSnapshot, setMatchSnapshot] = useState<MatchSnapshot | null>(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${getBackendBaseUrl()}/rooms`);
      const data = (await res.json()) as { rooms: RoomSummary[] };
      setRoomList(data.rooms ?? []);
    } catch {
      setRoomList([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;
    (async () => {
      try {
        const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
        const url = `ws://localhost:${port}/ws`;
        await client.connect(url);
        if (!active) return;
        setConnected(true);
        unsub = client.subscribe((evt: ServerEvent) => {
          if (evt.type === "room:state") {
            setRoom(evt.payload);
            setError(null);
            setCreating(false);
            setJoining(false);
            if (evt.payload.status === "in_game") setStarting(false);
          }
          if (evt.type === "match:snapshot") {
            if (!roomRef.current) return;
            pushSnapshot(evt.payload);
            setMatchSnapshot(getLatestSnapshot());
            setInMatch(true);
            setStarting(false);
            if (evt.payload.status === "ended") {
              setMatchEnded(true);
              setMatchWinnerId(evt.payload.winnerId ?? null);
            }
          }
          if (evt.type === "match:ended") {
            setMatchEnded(true);
            setMatchWinnerId(evt.payload.winnerId ?? null);
          }
          if (evt.type === "room:closed") {
            setRoom(null);
            setMatchSnapshot(null);
            clearSnapshotBuffer();
            setError(null);
            fetchRooms();
          }
          if (evt.type === "error") {
            setError(errorMessageFromCode(evt.payload.code, evt.payload.message));
            setCreating(false);
            setJoining(false);
            setStarting(false);
          }
        });
      } catch (e) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : "WebSocket connect error";
        setError(msg);
      }
    })();
    return () => {
      active = false;
      if (unsub) unsub();
      client.disconnect();
      clearSnapshotBuffer();
    };
  }, [client, fetchRooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const onCreateRoom = () => {
    if (!connected) return;
    setCreating(true);
    setError(null);
    const event: ClientEvent = { type: "room:create", payload: {} };
    client.send(event);
  };

  const onJoinRoom = (roomId: string) => {
    if (!connected) return;
    setJoining(true);
    setError(null);
    client.send({ type: "room:join", payload: { roomId } });
  };

  const onJoinByCode = () => {
    const id = joinCode.trim();
    if (!id || !connected) return;
    setJoining(true);
    setError(null);
    client.send({ type: "room:join", payload: { roomId: id } });
  };

  const copyRoomId = useCallback(() => {
    if (!room?.roomId) return;
    void navigator.clipboard.writeText(room.roomId);
  }, [room?.roomId]);

  const onSelectCharacter = (characterId: CharacterId) => {
    if (!connected || !room) return;
    setError(null);
    client.send({ type: "room:select_character", payload: { characterId } });
  };

  const takenCharacterIds = useMemo(() => {
    if (!room) return new Set<string>();
    return new Set(room.players.map((p) => p.characterId).filter(Boolean) as string[]);
  }, [room]);

  const onMarkReady = (ready: boolean) => {
    if (!connected || !room) return;
    setError(null);
    client.send({ type: "room:ready", payload: { ready } });
  };

  const canStart =
    room &&
    room.players.length >= MIN_PLAYERS_TO_START &&
    room.players.every((p) => p.ready);

  const onStartMatch = () => {
    if (!connected || !canStart) return;
    setStarting(true);
    setError(null);
    client.send({ type: "room:start_match", payload: {} });
  };

  const matchGetSnapshot = useCallback(() => getDisplaySnapshot(), []);
  const matchOnInput = useCallback((input: PlayerInput) => {
    if (matchEnded) return;
    clientRef.current.send(toClientEvent(input));
  }, [matchEnded]);

  const onBackToRooms = useCallback(() => {
    setInMatch(false);
    setMatchSnapshot(null);
    setMatchEnded(false);
    setMatchWinnerId(null);
    setRoom(null);
    clearSnapshotBuffer();
    setError(null);
    fetchRooms();
  }, [fetchRooms]);

  if (inMatch && matchEnded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-8">
        <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-800/95 p-8 text-center shadow-2xl">
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">
            Match finished
          </h2>
          <p className="mb-6 text-zinc-300">
            {matchWinnerId
              ? `Winner: ${matchWinnerId}`
              : "Draw — no winner"}
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

  if (inMatch) {
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

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 text-zinc-100 shadow-xl">
        <h1 className="mb-4 text-lg font-semibold">Rooms</h1>
        {!connected && (
          <p className="mb-2 text-sm text-zinc-400">Connecting to server…</p>
        )}
        {error && (
          <p className="mb-2 text-sm text-red-400">Error: {error}</p>
        )}

        <section className="mb-4">
          <button
            type="button"
            onClick={onCreateRoom}
            disabled={!connected || creating}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-emerald-700/60"
          >
            {creating ? "Creating…" : "Create room"}
          </button>
        </section>

        <section className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Join by code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room ID"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={onJoinByCode}
              disabled={!connected || joining || !joinCode.trim()}
              className="rounded bg-zinc-600 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </section>

        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400">Browse rooms</h2>
            <button
              type="button"
              onClick={fetchRooms}
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

        {room && (
          <div className="space-y-3 rounded border border-zinc-700 p-3 text-sm">
            <div>
              <span className="font-mono text-xs uppercase text-zinc-400">Room ID</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="break-all font-mono text-sm">{room.roomId}</span>
                <button
                  type="button"
                  onClick={copyRoomId}
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
                      onClick={() => onSelectCharacter(id)}
                      disabled={!connected || taken}
                      className="rounded border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:line-through"
                    >
                      {CHARACTER_LABELS[id]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="font-mono text-xs uppercase text-zinc-400">
                Ready
              </span>
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
        )}
        {!room && !error && (
          <p className="mt-2 text-xs text-zinc-500">
            Create a room or join by code / from the list.
          </p>
        )}
      </div>
    </main>
  );
}

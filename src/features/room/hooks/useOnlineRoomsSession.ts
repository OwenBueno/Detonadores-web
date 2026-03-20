"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MatchSnapshot,
  PlayerInput,
  RoomStatePayload,
  ServerEvent,
} from "@/src/shared/types";
import { ERROR_CODES } from "@/src/shared/types";
import { createMatchWsClient, getBackendWebSocketUrl, getGuestSession } from "@/src/shared/lib";
import type { CharacterId } from "@/src/shared/constants/characters";
import {
  clearSnapshotBuffer,
  getDisplaySnapshot,
  getLatestSnapshot,
  pushSnapshot,
} from "@/src/features/match/lib/snapshotInterpolation";
import { MIN_PLAYERS_TO_START } from "../constants";
import { errorMessageFromCode } from "../lib/errorMessages";
import { fetchJoinableRooms } from "../lib/fetchRoomList";
import { toClientEvent } from "../lib/playerInputToClientEvent";
import {
  clearResumePayload,
  readResumePayload,
  writeResumePayload,
} from "../lib/resumeMatchStorage";
import type { RoomSummary } from "../types";

function computeLocalMatchPlayerId(
  r: RoomStatePayload | null,
  seatId: string | null
): string | null {
  if (!r?.players?.length || !seatId) return null;
  const idx = r.players.findIndex((p) => p.id === seatId);
  if (idx < 0) return null;
  return `player-${idx}`;
}

export function useOnlineRoomsSession() {
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
  const [resultsLocalPlayerId, setResultsLocalPlayerId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [matchmakingSearching, setMatchmakingSearching] = useState(false);
  const [resumeReconnecting, setResumeReconnecting] = useState(false);
  const mySeatConnectionIdRef = useRef<string | null>(null);
  const [mySeatConnectionId, setMySeatConnectionId] = useState<string | null>(null);
  const reconnectAwaitingSnapshotRef = useRef(false);

  const localMatchPlayerId = useMemo(() => {
    if (!room?.players?.length || !mySeatConnectionId) return null;
    const idx = room.players.findIndex((p) => p.id === mySeatConnectionId);
    if (idx < 0) return null;
    return `player-${idx}`;
  }, [room, mySeatConnectionId]);

  const fetchRooms = useCallback(async () => {
    setLoadingList(true);
    try {
      setRoomList(await fetchJoinableRooms());
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;
    (async () => {
      try {
        const session = getGuestSession();
        if (!session) return;
        await client.connect(getBackendWebSocketUrl(session.token));
        if (!active) return;
        setConnected(true);
        unsub = client.subscribe((evt: ServerEvent) => {
          if (evt.type === "matchmaking:status") {
            setMatchmakingSearching(evt.payload.status === "queued");
            if (evt.payload.status === "idle") setError(null);
          }
          if (evt.type === "room:identity") {
            mySeatConnectionIdRef.current = evt.payload.connectionId;
            setMySeatConnectionId(evt.payload.connectionId);
          }
          if (evt.type === "room:state") {
            setMatchmakingSearching(false);
            setRoom(evt.payload);
            setError(null);
            setCreating(false);
            setJoining(false);
            if (evt.payload.status === "in_game") {
              setStarting(false);
              if (mySeatConnectionIdRef.current) {
                writeResumePayload({
                  roomId: evt.payload.roomId,
                  seatConnectionId: mySeatConnectionIdRef.current,
                });
              }
            }
          }
          if (evt.type === "match:snapshot") {
            if (!roomRef.current && !reconnectAwaitingSnapshotRef.current) return;
            reconnectAwaitingSnapshotRef.current = false;
            setResumeReconnecting(false);
            pushSnapshot(evt.payload);
            setMatchSnapshot(getLatestSnapshot());
            setInMatch(true);
            setStarting(false);
            const r = roomRef.current;
            if (
              r?.status === "in_game" &&
              mySeatConnectionIdRef.current
            ) {
              writeResumePayload({
                roomId: r.roomId,
                seatConnectionId: mySeatConnectionIdRef.current,
              });
            }
            if (evt.payload.status === "ended") {
              setMatchEnded(true);
              setMatchWinnerId(evt.payload.winnerId ?? null);
              setResultsLocalPlayerId((prev) =>
                prev ??
                computeLocalMatchPlayerId(
                  roomRef.current,
                  mySeatConnectionIdRef.current
                )
              );
              clearResumePayload();
            }
          }
          if (evt.type === "match:ended") {
            setMatchEnded(true);
            setMatchWinnerId(evt.payload.winnerId ?? null);
            setResultsLocalPlayerId((prev) =>
              prev ??
              computeLocalMatchPlayerId(
                roomRef.current,
                mySeatConnectionIdRef.current
              )
            );
            clearResumePayload();
          }
          if (evt.type === "room:closed") {
            setRoom(null);
            setMatchmakingSearching(false);
            setMatchSnapshot(null);
            clearSnapshotBuffer();
            setError(null);
            mySeatConnectionIdRef.current = null;
            setMySeatConnectionId(null);
            clearResumePayload();
            fetchRooms();
          }
          if (evt.type === "error") {
            const code = evt.payload.code;
            if (
              code === ERROR_CODES.RECONNECT_FAILED ||
              code === ERROR_CODES.RECONNECT_SEAT_TAKEN
            ) {
              reconnectAwaitingSnapshotRef.current = false;
              setResumeReconnecting(false);
              clearResumePayload();
            }
            setError(errorMessageFromCode(code, evt.payload.message));
            setCreating(false);
            setJoining(false);
            setStarting(false);
            setMatchmakingSearching(false);
          }
        });

        const resume = readResumePayload();
        if (resume) {
          reconnectAwaitingSnapshotRef.current = true;
          setResumeReconnecting(true);
          setRoom((prev) =>
            prev ??
            ({
              roomId: resume.roomId,
              players: [],
              status: "in_game",
            } as RoomStatePayload)
          );
          client.send({
            type: "match:reconnect",
            payload: {
              roomId: resume.roomId,
              seatConnectionId: resume.seatConnectionId,
            },
          });
        }
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

  const onCreateRoom = useCallback(() => {
    if (!connected) return;
    setCreating(true);
    setError(null);
    client.send({ type: "room:create", payload: {} });
  }, [client, connected]);

  const onJoinRoom = useCallback(
    (roomId: string) => {
      if (!connected) return;
      setJoining(true);
      setError(null);
      client.send({ type: "room:join", payload: { roomId } });
    },
    [client, connected]
  );

  const onJoinByCode = useCallback(() => {
    const id = joinCode.trim();
    if (!id || !connected) return;
    setJoining(true);
    setError(null);
    client.send({ type: "room:join", payload: { roomId: id } });
  }, [client, connected, joinCode]);

  const onMatchmakingJoin = useCallback(() => {
    if (!connected || room) return;
    setError(null);
    client.send({ type: "matchmaking:join", payload: {} });
  }, [client, connected, room]);

  const onMatchmakingLeave = useCallback(() => {
    if (!connected) return;
    client.send({ type: "matchmaking:leave", payload: {} });
  }, [client, connected]);

  const copyRoomId = useCallback(() => {
    if (!room?.roomId) return;
    void navigator.clipboard.writeText(room.roomId);
  }, [room?.roomId]);

  const onSelectCharacter = useCallback(
    (characterId: CharacterId) => {
      if (!connected || !room) return;
      setError(null);
      client.send({ type: "room:select_character", payload: { characterId } });
    },
    [client, connected, room]
  );

  const takenCharacterIds = useMemo(() => {
    if (!room) return new Set<string>();
    return new Set(room.players.map((p) => p.characterId).filter(Boolean) as string[]);
  }, [room]);

  const onMarkReady = useCallback(
    (ready: boolean) => {
      if (!connected || !room) return;
      setError(null);
      client.send({ type: "room:ready", payload: { ready } });
    },
    [client, connected, room]
  );

  const canStart =
    !!room &&
    room.players.length >= MIN_PLAYERS_TO_START &&
    room.players.every((p) => p.ready);

  const onStartMatch = useCallback(() => {
    if (!connected || !canStart) return;
    setStarting(true);
    setError(null);
    client.send({ type: "room:start_match", payload: {} });
  }, [client, connected, canStart]);

  const matchGetSnapshot = useCallback(() => getDisplaySnapshot(), []);

  const matchOnInput = useCallback(
    (input: PlayerInput) => {
      if (matchEnded) return;
      clientRef.current.send(toClientEvent(input));
    },
    [matchEnded]
  );

  const leaveMatchResults = useCallback(() => {
    setInMatch(false);
    setMatchSnapshot(null);
    setMatchEnded(false);
    setMatchWinnerId(null);
    setResultsLocalPlayerId(null);
    setRoom(null);
    setStarting(false);
    clearSnapshotBuffer();
    setError(null);
    fetchRooms();
  }, [fetchRooms]);

  return {
    connected,
    resumeReconnecting,
    error,
    room,
    roomList,
    loadingList,
    joinCode,
    setJoinCode,
    joining,
    creating,
    matchmakingSearching,
    starting,
    inMatch,
    matchEnded,
    matchWinnerId,
    matchSnapshot,
    fetchRooms,
    onCreateRoom,
    onJoinRoom,
    onJoinByCode,
    onMatchmakingJoin,
    onMatchmakingLeave,
    copyRoomId,
    onSelectCharacter,
    onMarkReady,
    canStart,
    onStartMatch,
    matchGetSnapshot,
    matchOnInput,
    leaveMatchResults,
    onBackToRooms: leaveMatchResults,
    takenCharacterIds,
    localMatchPlayerId,
    resultsLocalPlayerId,
  };
}

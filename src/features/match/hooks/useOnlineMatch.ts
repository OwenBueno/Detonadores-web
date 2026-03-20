"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientEvent, MatchSnapshot, PlayerInput, ServerEvent } from "../../../shared/types";
import { createMatchWsClient } from "../../../shared/lib";
import {
  clearSnapshotBuffer,
  getDisplaySnapshot,
  getLatestSnapshot,
  pushSnapshot,
} from "../lib/snapshotInterpolation";

function toClientEvent(input: PlayerInput): ClientEvent {
  if (input === "place_bomb") return { type: "match:place_bomb", payload: {} };
  return { type: "match:input", payload: { input } };
}

export function useOnlineMatch(): {
  snapshot: MatchSnapshot | null;
  getSnapshot: () => MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
  restart: () => void;
  connected: boolean;
  ended: boolean;
  winnerId: string | null;
  lastError: string | null;
} {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const client = useMemo(() => createMatchWsClient(), []);
  const clientRef = useRef(client);
  clientRef.current = client;

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
          if (evt.type === "match:snapshot") {
            pushSnapshot(evt.payload);
            setSnapshot(getLatestSnapshot());
            if (evt.payload.status === "ended") {
              setEnded(true);
              setWinnerId(evt.payload.winnerId ?? null);
            }
          }
          if (evt.type === "match:ended") {
            setEnded(true);
            setWinnerId(evt.payload.winnerId ?? null);
          }
          if (evt.type === "error") setLastError(evt.payload.message ?? evt.payload.code);
        });
      } catch (e) {
        if (!active) return;
        const errMsg = e instanceof Error ? e.message : "WebSocket connect error";
        setLastError(errMsg);
      }
    })();
    return () => {
      active = false;
      if (unsub) unsub();
      client.disconnect();
      setConnected(false);
      setEnded(false);
      setWinnerId(null);
      clearSnapshotBuffer();
    };
  }, [client]);

  const getSnapshot = useCallback(() => getDisplaySnapshot(), []);

  const onInput = useCallback(
    (input: PlayerInput) => {
      if (ended) return;
      clientRef.current.send(toClientEvent(input));
    },
    [ended]
  );

  const restart = useCallback(() => {}, []);

  return { snapshot, getSnapshot, onInput, restart, connected, ended, winnerId, lastError };
}


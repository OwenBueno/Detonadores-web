"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchSnapshot, PlayerState } from "@/src/shared/types";
import { SUDDEN_DEATH_START_TICK } from "../constants";

export interface MatchHudProps {
  snapshot: MatchSnapshot | null;
  localPlayerId: string | null;
  className?: string;
}

type Toast = { id: string; message: string };

export function MatchHud({ snapshot, localPlayerId, className = "" }: MatchHudProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevRef = useRef<{ tick: number; p: PlayerState | null }>({ tick: -1, p: null });

  const me =
    snapshot && localPlayerId
      ? snapshot.players.find((p) => p.id === localPlayerId) ?? null
      : null;

  useEffect(() => {
    if (!snapshot || !localPlayerId) {
      prevRef.current = { tick: -1, p: null };
      return;
    }
    const player = snapshot.players.find((p) => p.id === localPlayerId);
    if (!player) return;

    const prev = prevRef.current;
    if (prev.p === null) {
      prevRef.current = { tick: snapshot.tick, p: player };
      return;
    }
    if (snapshot.tick < prev.tick) {
      prevRef.current = { tick: snapshot.tick, p: player };
      return;
    }
    if (snapshot.tick === prev.tick) {
      prevRef.current = { tick: snapshot.tick, p: player };
      return;
    }

    if (snapshot.status === "active" && prev.p) {
      const messages: string[] = [];
      if (player.bombs > prev.p.bombs) messages.push("+1 bomb");
      if (player.range > prev.p.range) messages.push("Range up");
      const sp = prev.p.speed ?? 1;
      const sn = player.speed ?? 1;
      if (sn > sp) messages.push("Speed up");
      if (player.shieldActive && !prev.p.shieldActive) messages.push("Shield on");

      for (const message of messages) {
        const id = `${snapshot.tick}-${message}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((t) => [...t, { id, message }]);
        window.setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, 2600);
      }
    }

    prevRef.current = { tick: snapshot.tick, p: player };
  }, [snapshot, localPlayerId]);

  if (!snapshot) return null;

  const suddenDeath =
    snapshot.status === "active" && snapshot.tick >= SUDDEN_DEATH_START_TICK;
  const localReconnect =
    me?.reconnectPending === true
      ? "You are reconnecting — input may be delayed."
      : null;

  return (
    <>
      {suddenDeath && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-amber-500/95 py-2 text-center text-sm font-semibold text-amber-950 shadow-md"
          role="status"
          aria-live="polite"
        >
          Sudden death — the arena is collapsing
        </div>
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 border-t border-zinc-600/80 bg-zinc-900/92 px-4 py-3 text-zinc-100 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm ${className}`}
        aria-label="Match status"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Match
            </p>
            <p className="text-sm text-zinc-100">
              <span className="capitalize">{snapshot.status}</span>
              <span className="text-zinc-500"> · </span>
              <span className="text-zinc-400">Tick {snapshot.tick}</span>
            </p>
          </div>
          {me ? (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                You ({localPlayerId})
              </p>
              <p className="text-sm">
                <span className={me.alive ? "text-emerald-400" : "text-red-400"}>
                  {me.alive ? "Alive" : "Eliminated"}
                </span>
                <span className="text-zinc-500"> · </span>
                <span className="text-zinc-300">Bombs {me.bombs}</span>
                <span className="text-zinc-500"> · </span>
                <span className="text-zinc-300">Range {me.range}</span>
                <span className="text-zinc-500"> · </span>
                <span className="text-zinc-300">Speed {me.speed ?? 1}</span>
                <span className="text-zinc-500"> · </span>
                <span className="text-zinc-300">
                  Shield {me.shieldActive ? "on" : "off"}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Waiting for player slot…</p>
          )}
        </div>
        {localReconnect && (
          <p className="mt-2 text-xs text-amber-300/95" role="status">
            {localReconnect}
          </p>
        )}
        {snapshot.status === "ended" && (
          <p className="mt-2 text-sm text-zinc-300">
            {snapshot.winnerId ? `Winner: ${snapshot.winnerId}` : "Draw"}
          </p>
        )}
      </div>
      <div
        className="pointer-events-none absolute bottom-24 left-1/2 z-20 flex max-w-md -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-md bg-emerald-600/95 px-3 py-1.5 text-center text-sm font-medium text-white shadow-lg"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

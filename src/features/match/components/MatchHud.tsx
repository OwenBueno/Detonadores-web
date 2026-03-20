"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchSnapshot, PlayerState } from "@/src/shared/types";
import {
  isSfxMuted,
  playMatchSfx,
  primeSfxContext,
  setSfxMuted,
} from "../audio/matchFeedbackSfx";
import { SUDDEN_DEATH_START_TICK } from "../constants";

export interface MatchHudProps {
  snapshot: MatchSnapshot | null;
  localPlayerId: string | null;
  className?: string;
}

type Toast = { id: string; message: string; variant: "pickup" | "death" };

export function MatchHud({ snapshot, localPlayerId, className = "" }: MatchHudProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sfxMuted, setSfxMutedState] = useState(() =>
    typeof window !== "undefined" ? isSfxMuted() : false
  );
  const prevRef = useRef<{ tick: number; p: PlayerState | null }>({ tick: -1, p: null });
  const endedSfxRef = useRef(false);

  const me =
    snapshot && localPlayerId
      ? snapshot.players.find((p) => p.id === localPlayerId) ?? null
      : null;

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.status === "ended" && !endedSfxRef.current) {
      endedSfxRef.current = true;
      playMatchSfx("match_end");
    }
    if (snapshot.status !== "ended") {
      endedSfxRef.current = false;
    }
  }, [snapshot?.status]);

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
      if (prev.p.alive && !player.alive) {
        playMatchSfx("death");
        const id = `${snapshot.tick}-death-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((t) => [...t, { id, message: "Eliminated", variant: "death" }]);
        window.setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, 3200);
      }

      const messages: string[] = [];
      if (player.bombs > prev.p.bombs) messages.push("+1 bomb");
      if (player.range > prev.p.range) messages.push("Range up");
      const sp = prev.p.speed ?? 1;
      const sn = player.speed ?? 1;
      if (sn > sp) messages.push("Speed up");
      if (player.shieldActive && !prev.p.shieldActive) messages.push("Shield on");

      for (const message of messages) {
        playMatchSfx("pickup");
        const id = `${snapshot.tick}-${message}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((t) => [...t, { id, message, variant: "pickup" }]);
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

  const toggleSfxMute = () => {
    primeSfxContext();
    const next = !isSfxMuted();
    setSfxMuted(next);
    setSfxMutedState(next);
  };

  return (
    <>
      <div className="absolute right-3 top-14 z-[40]">
        <button
          type="button"
          onClick={toggleSfxMute}
          className="rounded border border-zinc-500/80 bg-zinc-900/90 px-2 py-1 text-xs font-medium text-zinc-200 shadow-md hover:bg-zinc-800"
          aria-pressed={sfxMuted}
        >
          {sfxMuted ? "Unmute SFX" : "Mute SFX"}
        </button>
      </div>

      {snapshot.status === "ended" && (
        <div
          className="pointer-events-none fixed inset-0 z-[35] flex items-center justify-center bg-black/50 p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="pointer-events-auto max-w-md rounded-xl border-2 border-amber-600/80 bg-zinc-950 px-8 py-7 text-center shadow-2xl ring-1 ring-amber-500/30">
            <h2 className="text-xl font-bold tracking-tight text-amber-100">Match over</h2>
            <p className="mt-3 text-base text-zinc-200">
              {snapshot.winnerId ? (
                <>
                  Winner: <span className="font-mono text-amber-200">{snapshot.winnerId}</span>
                </>
              ) : (
                "Draw — no winner"
              )}
            </p>
          </div>
        </div>
      )}

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
          ) : localPlayerId ? (
            <p className="text-sm text-zinc-400">Waiting for player slot…</p>
          ) : (
            <p className="text-sm text-zinc-400">
              Online: use <span className="font-mono">?localPlayerId=player-0</span> for stats and pickup
              toasts.
            </p>
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
            className={
              t.variant === "death"
                ? "rounded-md bg-red-900/95 px-3 py-1.5 text-center text-sm font-medium text-red-50 shadow-lg ring-1 ring-red-500/40"
                : "rounded-md bg-emerald-600/95 px-3 py-1.5 text-center text-sm font-medium text-white shadow-lg"
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

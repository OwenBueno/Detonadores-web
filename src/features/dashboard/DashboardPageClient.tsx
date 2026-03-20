"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBackendBaseUrl } from "@/src/shared/lib";

type BackendState = "loading" | "ok" | "error";

export function DashboardPageClient() {
  const [backend, setBackend] = useState<BackendState>("loading");
  const [roomCountHint, setRoomCountHint] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getBackendBaseUrl();

    (async () => {
      try {
        const healthRes = await fetch(`${base}/health`);
        if (cancelled) return;
        if (!healthRes.ok) {
          setBackend("error");
          return;
        }
        setBackend("ok");
        try {
          const roomsRes = await fetch(`${base}/rooms`);
          if (cancelled || !roomsRes.ok) return;
          const data = (await roomsRes.json()) as { rooms?: unknown[] };
          setRoomCountHint(Array.isArray(data.rooms) ? data.rooms.length : 0);
        } catch {
          setRoomCountHint(null);
        }
      } catch {
        if (!cancelled) setBackend("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ctaBase =
    "flex flex-col rounded-lg border border-zinc-700 bg-zinc-800/50 p-5 text-left transition hover:border-zinc-500 hover:bg-zinc-800";
  const ctaDisabled = backend === "error";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Play</h1>
        <p className="mb-8 text-sm text-zinc-400">
          Choose how to get into a match. You&apos;ll use the same lobby for all options.
        </p>

        {backend === "loading" && (
          <p className="mb-6 text-sm text-zinc-500">Checking server…</p>
        )}
        {backend === "error" && (
          <div
            className="mb-6 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            Can&apos;t reach the game server. Start the backend and check{" "}
            <code className="rounded bg-black/30 px-1 font-mono text-xs">NEXT_PUBLIC_BACKEND_PORT</code>
            .
          </div>
        )}
        {backend === "ok" && (
          <p className="mb-6 text-sm text-emerald-400/90">
            Server online
            {roomCountHint !== null ? ` · ${roomCountHint} joinable room(s) listed` : ""}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/rooms?focus=matchmaking"
            className={`${ctaBase} ${ctaDisabled ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={ctaDisabled}
          >
            <span className="text-sm font-medium text-sky-400">Matchmaking</span>
            <span className="mt-1 text-xs text-zinc-500">
              Queue with other players (2–4). You&apos;ll drop into a lobby when a batch is ready.
            </span>
          </Link>
          <Link
            href="/rooms?focus=browse"
            className={`${ctaBase} ${ctaDisabled ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={ctaDisabled}
          >
            <span className="text-sm font-medium text-zinc-200">Browse rooms</span>
            <span className="mt-1 text-xs text-zinc-500">
              See open lobbies and join one, or refresh the list from the lobby screen.
            </span>
          </Link>
          <Link
            href="/rooms?focus=create"
            className={`${ctaBase} ${ctaDisabled ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={ctaDisabled}
          >
            <span className="text-sm font-medium text-emerald-400">Create room</span>
            <span className="mt-1 text-xs text-zinc-500">
              Host a private room and share the room code with friends.
            </span>
          </Link>
        </div>

        {backend === "error" && (
          <p className="mt-6 text-center text-xs text-zinc-600">
            <Link href="/rooms" className="text-zinc-500 underline hover:text-zinc-400">
              Open rooms anyway
            </Link>
          </p>
        )}

        <p className="mt-10 text-center text-xs text-zinc-600">
          <Link href="/match" className="hover:text-zinc-500">
            Dev: legacy match (room-0)
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBackendBaseUrl, getGuestSession, setGuestSession } from "@/src/shared/lib";

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function continueAsGuest() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getBackendBaseUrl()}/session/guest`, { method: "POST" });
      if (!res.ok) {
        setError(`Server returned ${res.status}`);
        return;
      }
      const data = (await res.json()) as { token: string; guestId: string };
      if (!data.token || !data.guestId) {
        setError("Invalid response");
        return;
      }
      setGuestSession({ token: data.token, guestId: data.guestId });
      router.push("/dashboard");
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  const existing = typeof window !== "undefined" ? getGuestSession() : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h1 className="mb-2 text-xl font-semibold">Detonadores</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in as a guest to play. Your session is stored on this device.
        </p>
        {existing && (
          <p className="mb-4 text-xs text-zinc-500">
            You already have a session.{" "}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-sky-400 underline hover:text-sky-300"
            >
              Continue to dashboard
            </button>
          </p>
        )}
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={continueAsGuest}
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connecting…" : "Continue as guest"}
        </button>
      </div>
    </main>
  );
}

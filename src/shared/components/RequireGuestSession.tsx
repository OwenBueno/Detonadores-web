"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getGuestSession } from "@/src/shared/lib/guestSession";

export function RequireGuestSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getGuestSession()) {
      router.replace("/auth");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  return children;
}

import { Suspense } from "react";
import { RoomsPageClient } from "@/src/features/room";
import { RequireGuestSession } from "@/src/shared/components/RequireGuestSession";

export default function RoomsPage() {
  return (
    <RequireGuestSession>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center p-8">
            <p className="text-sm text-zinc-500">Loading…</p>
          </main>
        }
      >
        <RoomsPageClient />
      </Suspense>
    </RequireGuestSession>
  );
}

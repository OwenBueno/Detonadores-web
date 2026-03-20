"use client";

import dynamic from "next/dynamic";
import { RequireGuestSession } from "@/src/shared/components/RequireGuestSession";

const MatchPageClient = dynamic(() => import("./MatchPageClient"), { ssr: false });

export default function MatchPage() {
  return (
    <RequireGuestSession>
      <MatchPageClient />
    </RequireGuestSession>
  );
}

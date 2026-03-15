"use client";

import dynamic from "next/dynamic";

const MatchPageClient = dynamic(() => import("./MatchPageClient"), { ssr: false });

export default function MatchPage() {
  return <MatchPageClient />;
}

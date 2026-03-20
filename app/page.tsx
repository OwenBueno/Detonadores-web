import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 px-6 text-center text-zinc-100">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Detonadores</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Online multiplayer Bomberman-style matches. Sign in as a guest to play.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/auth"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
        >
          Get started
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

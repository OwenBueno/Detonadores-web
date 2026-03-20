type Props = {
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  connected: boolean;
  joining: boolean;
  onJoinByCode: () => void;
};

export function JoinByCodeSection({
  joinCode,
  onJoinCodeChange,
  connected,
  joining,
  onJoinByCode,
}: Props) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-sm font-medium text-zinc-400">Join by code</h2>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Room ID"
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value)}
          className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={onJoinByCode}
          disabled={!connected || joining || !joinCode.trim()}
          className="rounded bg-zinc-600 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join"}
        </button>
      </div>
    </section>
  );
}

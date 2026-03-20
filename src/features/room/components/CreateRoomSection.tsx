type Props = {
  connected: boolean;
  creating: boolean;
  onCreateRoom: () => void;
};

export function CreateRoomSection({ connected, creating, onCreateRoom }: Props) {
  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={onCreateRoom}
        disabled={!connected || creating}
        className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-emerald-700/60"
      >
        {creating ? "Creating…" : "Create room"}
      </button>
    </section>
  );
}

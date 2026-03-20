import { getBackendBaseUrl } from "@/src/shared/lib/backendUrl";
import type { RoomSummary } from "../types";

export async function fetchJoinableRooms(): Promise<RoomSummary[]> {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/rooms`);
    const data = (await res.json()) as { rooms: RoomSummary[] };
    return data.rooms ?? [];
  } catch {
    return [];
  }
}

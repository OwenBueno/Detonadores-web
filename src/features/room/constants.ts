export const MAX_PLAYERS = 4;
export const MIN_PLAYERS_TO_START = 2;
export const RESUME_STORAGE_KEY = "detonadores:resumeMatch";

export const ROOMS_FOCUS_QUERY = ["matchmaking", "browse", "create"] as const;
export type RoomsFocusQuery = (typeof ROOMS_FOCUS_QUERY)[number];

export const ROOMS_SECTION_IDS: Record<RoomsFocusQuery, string> = {
  matchmaking: "rooms-focus-matchmaking",
  browse: "rooms-focus-browse",
  create: "rooms-focus-create",
};

export function parseRoomsFocus(raw: string | null): RoomsFocusQuery | null {
  if (!raw) return null;
  return (ROOMS_FOCUS_QUERY as readonly string[]).includes(raw) ? (raw as RoomsFocusQuery) : null;
}

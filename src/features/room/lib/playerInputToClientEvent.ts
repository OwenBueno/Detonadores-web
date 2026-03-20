import type { ClientEvent, PlayerInput } from "@/src/shared/types";

export function toClientEvent(input: PlayerInput): ClientEvent {
  if (input === "place_bomb") return { type: "match:place_bomb", payload: {} };
  return { type: "match:input", payload: { input } };
}

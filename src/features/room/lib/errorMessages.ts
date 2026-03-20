import { ERROR_CODES } from "@/src/shared/types";

export function errorMessageFromCode(code: string, message?: string): string {
  switch (code) {
    case ERROR_CODES.INVALID_ROOM_JOIN:
      return message ?? "Cannot join matchmaking from here (leave your room first)";
    case ERROR_CODES.CHARACTER_TAKEN:
      return "That character is already taken";
    case ERROR_CODES.NOT_ALL_READY:
      return "Not all players are ready";
    case ERROR_CODES.MIN_PLAYERS_NOT_MET:
      return "Minimum players to start not met";
    case ERROR_CODES.ROOM_NOT_WAITING:
      return "Room is not waiting to start";
    case ERROR_CODES.RECONNECT_FAILED:
      return message ?? "Could not reconnect to the match";
    case ERROR_CODES.RECONNECT_SEAT_TAKEN:
      return message ?? "This match seat is already in use";
    case ERROR_CODES.UNAUTHORIZED:
      return message ?? "Session invalid or expired — sign in again";
    default:
      return message ?? code ?? "Unknown error";
  }
}

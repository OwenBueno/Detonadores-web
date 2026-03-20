import { RESUME_STORAGE_KEY } from "../constants";

export type ResumeMatchPayload = {
  roomId: string;
  seatConnectionId: string;
};

export function readResumePayload(): ResumeMatchPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(RESUME_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ResumeMatchPayload;
    if (data.roomId && data.seatConnectionId) return data;
  } catch {
    sessionStorage.removeItem(RESUME_STORAGE_KEY);
  }
  return null;
}

export function writeResumePayload(payload: ResumeMatchPayload): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(payload));
}

export function clearResumePayload(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(RESUME_STORAGE_KEY);
}

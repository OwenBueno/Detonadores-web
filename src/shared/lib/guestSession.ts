const STORAGE_KEY = "detonadores:guestSession";

export type GuestSession = {
  token: string;
  guestId: string;
};

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GuestSession;
    if (data?.token && data?.guestId) return data;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function setGuestSession(session: GuestSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearGuestSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getBackendBaseUrl(): string {
  const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
  return `http://localhost:${port}`;
}

export function getBackendWebSocketUrl(token?: string): string {
  const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
  const base = `ws://localhost:${port}/ws`;
  if (!token) return base;
  return `${base}?token=${encodeURIComponent(token)}`;
}

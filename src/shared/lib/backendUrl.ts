export function getBackendBaseUrl(): string {
  const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
  return `http://localhost:${port}`;
}

export function getBackendWebSocketUrl(): string {
  const port = Number(process.env.NEXT_PUBLIC_BACKEND_PORT ?? 3001);
  return `ws://localhost:${port}/ws`;
}

import type { ClientEvent, ServerEvent } from "../types";

export type ServerEventCallback = (event: ServerEvent) => void;

export interface MatchWsClient {
  connect(url: string): Promise<void>;
  send(event: ClientEvent): void;
  subscribe(cb: ServerEventCallback): () => void;
  disconnect(): void;
}

export function createMatchWsClient(): MatchWsClient {
  const listeners: ServerEventCallback[] = [];
  let ws: WebSocket | null = null;
  let connectPromise: Promise<void> | null = null;

  return {
    async connect(url: string) {
      if (connectPromise) return connectPromise;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
      connectPromise = (async () => {
        try {
          ws = new WebSocket(url);
          ws.addEventListener("message", (evt) => {
            try {
              const parsed = JSON.parse(String(evt.data)) as ServerEvent;
              for (const cb of listeners) cb(parsed);
            } catch {
              // ignore malformed messages
            }
          });
          await new Promise<void>((resolve, reject) => {
            const cur = ws;
            if (!cur) return reject(new Error("WebSocket not created"));
            const onOpen = () => {
              cur.removeEventListener("open", onOpen);
              cur.removeEventListener("error", onError);
              resolve();
            };
            const onError = () => {
              cur.removeEventListener("open", onOpen);
              cur.removeEventListener("error", onError);
              reject(new Error("WebSocket connect error"));
            };
            cur.addEventListener("open", onOpen);
            cur.addEventListener("error", onError);
          });
        } finally {
          connectPromise = null;
        }
      })();
      return connectPromise;
    },

    send(event: ClientEvent) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(event));
    },

    subscribe(cb: ServerEventCallback) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i !== -1) listeners.splice(i, 1);
      };
    },

    disconnect() {
      if (!ws) return;
      ws.close();
      ws = null;
      connectPromise = null;
    },
  };
}

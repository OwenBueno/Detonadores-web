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

  return {
    async connect() {
      // Stub: real implementation will open WebSocket and route server events to listeners
    },

    send(_event: ClientEvent) {
      // Stub: real implementation will serialize and send via WebSocket
    },

    subscribe(cb: ServerEventCallback) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i !== -1) listeners.splice(i, 1);
      };
    },

    disconnect() {
      // Stub: real implementation will close WebSocket
    },
  };
}

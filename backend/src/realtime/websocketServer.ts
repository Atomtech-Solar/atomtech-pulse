import type { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

const clients = new Set<WebSocket>();

let wss: WebSocketServer | null = null;

export const REALTIME_PATH = "/realtime";

export function startRealtimeServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  console.log(`Realtime WebSocket disponível em ws://...${REALTIME_PATH}`);
  return wss;
}

export function getRealtimeWss(): WebSocketServer | null {
  return wss;
}

export function emitRealtime(event: string, data: unknown) {
  const payload = JSON.stringify({ event, data });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

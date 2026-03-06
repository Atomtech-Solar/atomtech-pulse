import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

const REALTIME_PORT = 3002;

const clients = new Set<WebSocket>();

let wss: WebSocketServer | null = null;

export function startRealtimeServer() {
  wss = new WebSocketServer({ port: REALTIME_PORT });

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  console.log(`Realtime WebSocket rodando na porta ${REALTIME_PORT}`);
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

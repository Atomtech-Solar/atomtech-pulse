import type { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { handleOcppMessage, setRealtimeEmitter } from "./ocppHandlers";

let wss: WebSocketServer | null = null;

export const OCPP_PATH_PREFIX = "/ocpp/";

export function startOcppServer(
  server: HttpServer,
  realtimeEmitter?: (event: string, data: unknown) => void
): WebSocketServer {
  if (realtimeEmitter) {
    setRealtimeEmitter(realtimeEmitter);
  }

  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req) => {
    const pathname = (req.url ?? "/").split("?")[0];
    const match = pathname.match(/^\/ocpp\/(.+)$/);
    const chargePointId = match ? decodeURIComponent(match[1]) : null;

    if (!chargePointId) {
      console.warn("[OCPP] Conexão rejeitada: use /ocpp/{chargePointId}");
      ws.close();
      return;
    }

    console.log("ChargePoint conectado:", chargePointId);

    ws.on("message", (message) => {
      handleOcppMessage(chargePointId, ws, message as Buffer);
    });

    ws.on("close", () => {
      console.log(`[OCPP] ${chargePointId} desconectado`);
    });

    ws.on("error", (err) => {
      console.error(`[OCPP] ${chargePointId} erro:`, err.message);
    });
  });

  console.log(`OCPP Server disponível em ws://.../ocpp/{chargePointId}`);
  return wss;
}

export function getOcppWss(): WebSocketServer | null {
  return wss;
}

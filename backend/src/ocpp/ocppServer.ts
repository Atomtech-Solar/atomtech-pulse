import { WebSocketServer } from "ws";
import { handleOcppMessage, setRealtimeEmitter } from "./ocppHandlers";

const OCPP_PORT = Number(process.env.OCPP_PORT) || 3001;

let wss: WebSocketServer | null = null;

export function startOcppServer(realtimeEmitter?: (event: string, data: unknown) => void) {
  if (realtimeEmitter) {
    setRealtimeEmitter(realtimeEmitter);
  }

  wss = new WebSocketServer({ port: OCPP_PORT });

  wss.on("connection", (ws, req) => {
    const pathname = (req.url || "/").split("?")[0];
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

  console.log(`OCPP Server rodando na porta ${OCPP_PORT}`);
  return wss;
}

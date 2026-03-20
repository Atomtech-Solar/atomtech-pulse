import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";
import { WebSocketServer } from "ws";
import { handleOcppMessage, setRealtimeEmitter, getRealtimeEmitter } from "./ocppHandlers";
import { updateStationOffline } from "../services/stationService";

/** Subprotocolo OCPP 1.6J obrigatório para carregadores reais */
export const OCPP_SUBPROTOCOL = "ocpp1.6";

let wss: WebSocketServer | null = null;

export const OCPP_PATH_PREFIX = "/ocpp/";

/** Aceita Sec-WebSocket-Protocol: ocpp1.6 no handshake (exigido por carregadores OCPP 1.6) */
function handleOcppProtocols(protocols: Set<string>, _req: IncomingMessage): string | false {
  if (protocols.has(OCPP_SUBPROTOCOL)) return OCPP_SUBPROTOCOL;
  return false;
}

export function startOcppServer(
  server: HttpServer,
  realtimeEmitter?: (event: string, data: unknown) => void
): WebSocketServer {
  if (realtimeEmitter) {
    setRealtimeEmitter(realtimeEmitter);
  }

  wss = new WebSocketServer({
    noServer: true,
    handleProtocols: handleOcppProtocols,
  });

  wss.on("connection", (ws, req) => {
    const pathname = (req.url ?? "/").split("?")[0];
    const match = pathname.match(/^\/ocpp\/(.+)$/);
    const chargePointId = match ? decodeURIComponent(match[1]) : null;

    if (!chargePointId) {
      console.warn("[OCPP] Conexão rejeitada: use /ocpp/{chargePointId}");
      ws.close();
      return;
    }

    console.log(`[OCPP] Carregador conectado: ${chargePointId}`);

    // Ping/pong para manter conexão estável (complementa Heartbeat OCPP)
    const PING_INTERVAL_MS = 30000;
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) ws.ping(); // 1 = OPEN
    }, PING_INTERVAL_MS);

    ws.on("message", (message) => {
      handleOcppMessage(chargePointId, ws, message as Buffer);
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      updateStationOffline(chargePointId)
        .then(() => getRealtimeEmitter()("station_offline", { chargePointId }))
        .catch((err) => console.error(`[OCPP] Erro ao marcar offline: ${chargePointId}`, err));
      console.log(`[OCPP] Carregador desconectado: ${chargePointId} | Estação offline`);
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

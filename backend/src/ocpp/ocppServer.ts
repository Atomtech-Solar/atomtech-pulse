import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";
import type { RawData, WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { handleOcppMessage, setRealtimeEmitter, getRealtimeEmitter } from "./ocppHandlers";
import {
  findStationByChargePointId,
  updateStationOffline,
  updateStationOnline,
  updateStationError,
} from "../services/stationService";
import {
  registerConnection,
  unregisterConnection,
  touchPresence,
} from "./chargerPresence";

/** Subprotocolo OCPP 1.6J obrigatório para carregadores reais */
export const OCPP_SUBPROTOCOL = "ocpp1.6";

let wss: WebSocketServer | null = null;

export const OCPP_PATH_PREFIX = "/ocpp/";

const PING_INTERVAL_MS = 30_000;

/** Aceita Sec-WebSocket-Protocol: ocpp1.6 no handshake (exigido por carregadores OCPP 1.6) */
function handleOcppProtocols(protocols: Set<string>, _req: IncomingMessage): string | false {
  if (protocols.has(OCPP_SUBPROTOCOL)) return OCPP_SUBPROTOCOL;
  return false;
}

function emitChargerStatus(data: Record<string, unknown>) {
  getRealtimeEmitter()("charger_status_changed", data);
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

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const pathname = (req.url ?? "/").split("?")[0];
    const match = pathname.match(/^\/ocpp\/(.+)$/);
    const chargePointId = match ? decodeURIComponent(match[1]) : null;

    if (!chargePointId) {
      console.warn("[OCPP] Conexão rejeitada: use /ocpp/{chargePointId}");
      ws.close(1008, "Invalid path");
      return;
    }

    const messageQueue: RawData[] = [];
    let ready = false;
    let stationId: string | null = null;

    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) ws.ping();
    }, PING_INTERVAL_MS);

    const flushQueue = () => {
      for (const m of messageQueue) {
        handleOcppMessage(chargePointId, ws, m as Buffer);
      }
      messageQueue.length = 0;
    };

    ws.on("message", (message: RawData) => {
      if (ready) {
        handleOcppMessage(chargePointId, ws, message as Buffer);
      } else {
        messageQueue.push(message);
      }
    });

    ws.on("pong", () => {
      touchPresence(chargePointId);
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      unregisterConnection(chargePointId);
      if (!stationId) return;
      void updateStationOffline(chargePointId)
        .then(() => {
          emitChargerStatus({
            id: stationId,
            chargePointId,
            status: "offline",
          });
          getRealtimeEmitter()("station_offline", { chargePointId });
        })
        .catch((err) => console.error(`[OCPP] Erro ao marcar offline: ${chargePointId}`, err));
      console.log(`[OCPP] Carregador desconectado: ${chargePointId} | Estação offline`);
    });

    ws.on("error", (err: Error) => {
      console.error(`[OCPP] ${chargePointId} erro socket:`, err.message);
      void findStationByChargePointId(chargePointId).then(async (station) => {
        if (!station) return;
        const msg = `Socket: ${err.message}`;
        await updateStationError(chargePointId, msg);
        emitChargerStatus({
          id: String(station.id),
          chargePointId,
          status: "error",
          last_error: msg,
        });
      });
    });

    void findStationByChargePointId(chargePointId)
      .then(async (station) => {
        if (!station) {
          console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
          getRealtimeEmitter()("charger_connection_rejected", {
            chargePointId,
            reason: "not_registered",
          });
          ws.close(1008, "Station not registered");
          return;
        }

        stationId = String(station.id);
        ready = true;
        registerConnection(chargePointId, ws);
        await updateStationOnline(chargePointId);
        touchPresence(chargePointId);

        emitChargerStatus({
          id: stationId,
          chargePointId,
          status: "online",
        });

        flushQueue();
        console.log(`[OCPP] Carregador conectado: ${chargePointId}`);
      })
      .catch((err) => {
        console.error(`[OCPP] Falha ao validar estação ${chargePointId}:`, err);
        ws.close(1011, "Internal error");
      });
  });

  console.log(`OCPP Server disponível em ws://.../ocpp/{chargePointId}`);
  return wss;
}

export function getOcppWss(): WebSocketServer | null {
  return wss;
}

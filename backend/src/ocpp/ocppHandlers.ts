import type { WebSocket } from "ws";
import {
  findStationByChargePointId,
  updateStationOnline,
  updateStationLastSeen,
  updateStationStatus,
  incrementStationSessions,
  addStationKwh,
} from "../services/stationService";

interface OcppMessage {
  messageTypeId: number;
  uniqueId: string;
  action?: string;
  payload?: unknown;
}

export type RealtimeEmitter = (event: string, data: unknown) => void;

let realtimeEmitter: RealtimeEmitter = () => {};

export function setRealtimeEmitter(emitter: RealtimeEmitter) {
  realtimeEmitter = emitter;
}

/** Mapa transactionId -> meterStart (Wh) para calcular kWh no StopTransaction */
const transactionMeterStart = new Map<number, number>();

function parseOcppMessage(data: Buffer | string): OcppMessage | null {
  try {
    const parsed = JSON.parse(data.toString());
    if (!Array.isArray(parsed) || parsed.length < 3) return null;
    return {
      messageTypeId: parsed[0],
      uniqueId: parsed[1],
      action: parsed[2],
      payload: parsed[3],
    };
  } catch {
    return null;
  }
}

function sendCallResult(ws: WebSocket, uniqueId: string, payload: unknown) {
  ws.send(JSON.stringify([3, uniqueId, payload]));
}

function sendCallError(ws: WebSocket, uniqueId: string, code: string, description: string) {
  ws.send(JSON.stringify([4, uniqueId, code, description, {}]));
}

export function handleOcppMessage(chargePointId: string, ws: WebSocket, data: Buffer | string): void {
  const msg = parseOcppMessage(data);
  if (!msg || msg.messageTypeId !== 2) return;

  const { uniqueId, action, payload } = msg;

  switch (action) {
    case "BootNotification":
      handleBootNotification(chargePointId, ws, uniqueId, payload);
      break;
    case "Heartbeat":
      handleHeartbeat(chargePointId, ws, uniqueId);
      break;
    case "StatusNotification":
      handleStatusNotification(chargePointId, ws, uniqueId, payload);
      break;
    case "StartTransaction":
      handleStartTransaction(chargePointId, ws, uniqueId, payload);
      break;
    case "StopTransaction":
      handleStopTransaction(chargePointId, ws, uniqueId, payload);
      break;
    case "MeterValues":
      handleMeterValues(chargePointId, ws, uniqueId);
      break;
    default:
      sendCallError(ws, uniqueId, "NotSupported", `Action ${action} não suportada`);
  }
}

async function handleBootNotification(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  _payload: unknown
) {
  console.log("BootNotification recebido");

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationOnline(chargePointId);
  } else {
    console.warn("Estação não cadastrada:", chargePointId);
  }

  const response = {
    status: "Accepted" as const,
    currentTime: new Date().toISOString(),
    interval: 300,
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("charge_point_connected", { chargePointId, action: "BootNotification" });
}

async function handleHeartbeat(chargePointId: string, ws: WebSocket, uniqueId: string) {
  console.log("Heartbeat recebido");

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationLastSeen(chargePointId);
  } else {
    console.warn("Estação não cadastrada:", chargePointId);
  }

  const response = {
    currentTime: new Date().toISOString(),
  };

  sendCallResult(ws, uniqueId, response);
}

async function handleStatusNotification(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { status?: string } | undefined;
  const status = p?.status ?? "Available";

  console.log("StatusNotification:", status);

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    const statusMap: Record<string, string> = {
      Available: "online",
      Preparing: "online",
      Charging: "charging",
      SuspendedEV: "charging",
      SuspendedEVSE: "charging",
      Finishing: "online",
      Reserved: "online",
      Unavailable: "unavailable",
      Faulted: "faulted",
    };
    const dbStatus = statusMap[status] ?? "offline";
    await updateStationStatus(chargePointId, dbStatus);
    realtimeEmitter("status_notification", { chargePointId, status: dbStatus });
  } else {
    console.warn("Estação não cadastrada:", chargePointId);
  }

  sendCallResult(ws, uniqueId, {});
}

async function handleStartTransaction(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { connectorId?: number; idTag?: string; meterStart?: number } | undefined;
  const meterStart = p?.meterStart ?? 0;
  const transactionId = Math.floor(Math.random() * 1_000_000);

  transactionMeterStart.set(transactionId, meterStart);

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await incrementStationSessions(chargePointId);
  } else {
    console.warn("Estação não cadastrada:", chargePointId);
  }

  const response = {
    transactionId,
    idTagInfo: { status: "Accepted" as const },
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("start_transaction", { chargePointId, transactionId });
}

async function handleStopTransaction(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { transactionId?: number; meterStop?: number } | undefined;
  const transactionId = p?.transactionId;
  const meterStop = p?.meterStop ?? 0;

  let energiaKwh = 0;
  if (transactionId != null) {
    const meterStart = transactionMeterStart.get(transactionId) ?? 0;
    energiaKwh = Math.max(0, (meterStop - meterStart) / 1000);
    transactionMeterStart.delete(transactionId);
  }

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    if (energiaKwh > 0) {
      await addStationKwh(chargePointId, energiaKwh);
    }
  } else {
    console.warn("Estação não cadastrada:", chargePointId);
  }

  const response = {
    idTagInfo: { status: "Accepted" as const },
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("stop_transaction", { chargePointId });
}

async function handleMeterValues(chargePointId: string, ws: WebSocket, uniqueId: string) {
  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationLastSeen(chargePointId);
  }

  sendCallResult(ws, uniqueId, {});
}

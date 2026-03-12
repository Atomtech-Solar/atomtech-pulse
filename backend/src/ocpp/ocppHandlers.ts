import type { WebSocket } from "ws";
import {
  findStationByChargePointId,
  updateStationBootInfo,
  updateStationLastSeen,
  updateStationStatus,
  incrementStationSessions,
} from "../services/stationService";
import {
  createTransaction,
  stopTransaction,
  updateTransactionEnergy,
} from "../services/transactionService";

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

export function getRealtimeEmitter(): RealtimeEmitter {
  return realtimeEmitter;
}

function parseOcppMessage(data: Buffer | string): OcppMessage | null {
  try {
    const parsed = JSON.parse(data.toString());
    if (!Array.isArray(parsed) || parsed.length < 3) return null;
    return {
      messageTypeId: parsed[0],
      uniqueId: String(parsed[1] ?? ""),
      action: parsed[2],
      payload: parsed[3],
    };
  } catch {
    return null;
  }
}

/** Extrai uniqueId de mensagem possivelmente malformada para enviar CallError */
function tryExtractUniqueId(data: Buffer | string): string | null {
  try {
    const parsed = JSON.parse(data.toString());
    if (Array.isArray(parsed) && parsed.length >= 2 && parsed[1] != null) {
      return String(parsed[1]);
    }
  } catch {
    /* ignorar */
  }
  return null;
}

function sendCallResult(ws: WebSocket, uniqueId: string, payload: unknown) {
  ws.send(JSON.stringify([3, uniqueId, payload]));
}

function sendCallError(ws: WebSocket, uniqueId: string, code: string, description: string) {
  ws.send(JSON.stringify([4, uniqueId, code, description, {}]));
}

export function handleOcppMessage(chargePointId: string, ws: WebSocket, data: Buffer | string): void {
  const msg = parseOcppMessage(data);
  if (!msg) {
    const uniqueId = tryExtractUniqueId(data);
    if (uniqueId) {
      sendCallError(ws, uniqueId, "FormationViolation", "Mensagem JSON inválida ou formato incorreto");
    }
    console.error(`[OCPP] Erro de protocolo (${chargePointId}): mensagem JSON inválida`);
    return;
  }
  if (msg.messageTypeId !== 2) {
    const uniqueId = msg.uniqueId || tryExtractUniqueId(data);
    if (uniqueId) {
      sendCallError(ws, uniqueId, "FormationViolation", `Tipo de mensagem inválido: ${msg.messageTypeId} (esperado 2=CALL)`);
    }
    console.warn(`[OCPP] Mensagem ignorada (${chargePointId}): tipo ${msg.messageTypeId}`);
    return;
  }

  const { uniqueId, action, payload } = msg;
  console.log(`[OCPP] Mensagem recebida: ${chargePointId} → ${action}`);

  switch (action) {
    case "BootNotification":
      handleBootNotification(chargePointId, ws, uniqueId, payload);
      break;
    case "Heartbeat":
      handleHeartbeat(chargePointId, ws, uniqueId);
      break;
    case "Authorize":
      handleAuthorize(chargePointId, ws, uniqueId, payload);
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
      handleMeterValues(chargePointId, ws, uniqueId, payload);
      break;
    default:
      console.warn(`[OCPP] Action não suportada: ${chargePointId} → ${action}`);
      sendCallError(ws, uniqueId, "NotSupported", `Action ${action} não suportada`);
  }
}

async function handleBootNotification(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { chargePointVendor?: string; chargePointModel?: string } | undefined;
  const vendor = p?.chargePointVendor;
  const model = p?.chargePointModel;

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationBootInfo(chargePointId, vendor, model);
  } else {
    console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
  }

  const response = {
    status: "Accepted" as const,
    currentTime: new Date().toISOString(),
    interval: 300,
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("charge_point_connected", { chargePointId, action: "BootNotification" });
}

/** Valida idTag antes de iniciar transação (OCPP 1.6 Core). Aceita todos os ids por padrão. */
async function handleAuthorize(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { idTag?: string } | undefined;
  const idTag = p?.idTag ?? "";
  console.log(`[OCPP] Authorize: ${chargePointId} idTag=${idTag}`);

  const response = {
    idTagInfo: { status: "Accepted" as const },
  };
  sendCallResult(ws, uniqueId, response);
}

async function handleHeartbeat(chargePointId: string, ws: WebSocket, uniqueId: string) {
  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationLastSeen(chargePointId);
  } else {
    console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
  }

  sendCallResult(ws, uniqueId, { currentTime: new Date().toISOString() });
}

async function handleStatusNotification(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { status?: string } | undefined;
  const status = p?.status ?? "Available";

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
    console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
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
  const connectorId = p?.connectorId ?? 1;
  const meterStart = p?.meterStart ?? 0;
  const ocppTransactionId = Math.floor(Math.random() * 1_000_000) + 1;

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    const tx = await createTransaction(
      chargePointId,
      Number(station.id),
      connectorId,
      meterStart,
      ocppTransactionId
    );
    if (tx) {
      await incrementStationSessions(chargePointId);
    }
  } else {
    console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
  }

  const response = {
    transactionId: ocppTransactionId,
    idTagInfo: { status: "Accepted" as const },
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("start_transaction", { chargePointId, transactionId: ocppTransactionId });
  console.log(`[OCPP] Sessão iniciada: ${chargePointId} | connector=${connectorId} | txId=${ocppTransactionId}`);
}

async function handleStopTransaction(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const p = payload as { transactionId?: number; meterStop?: number } | undefined;
  const ocppTransactionId = p?.transactionId;
  const meterStop = p?.meterStop ?? 0;

  let energyKwh = 0;
  if (ocppTransactionId != null) {
    const result = await stopTransaction(ocppTransactionId, meterStop);
    if (result) {
      energyKwh = result.energyKwh;
      console.log(
        `[OCPP] Sessão finalizada: ${chargePointId} | txId=${ocppTransactionId} | energia=${energyKwh.toFixed(2)} kWh`
      );
    }
  }

  const response = {
    idTagInfo: { status: "Accepted" as const },
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("stop_transaction", { chargePointId });
}

async function handleMeterValues(
  chargePointId: string,
  ws: WebSocket,
  uniqueId: string,
  payload: unknown
) {
  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationLastSeen(chargePointId);
  }

  const p = payload as {
    connectorId?: number;
    transactionId?: number;
    meterValue?: Array<{
      sampledValue?: Array<{ value: string; measurand?: string }>;
    }>;
  } | undefined;

  const ocppTransactionId = p?.transactionId;
  const meterValue = p?.meterValue?.[0];
  const sampledValue = meterValue?.sampledValue?.find(
    (s) => s.measurand === "Energy.Active.Import.Register"
  );

  if (ocppTransactionId != null && sampledValue) {
    const value = parseFloat(sampledValue.value) || 0;
    await updateTransactionEnergy(ocppTransactionId, value);
  }

  sendCallResult(ws, uniqueId, {});
}

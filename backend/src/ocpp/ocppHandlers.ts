import type { WebSocket } from "ws";
import {
  findStationByChargePointId,
  updateStationBootInfo,
  updateStationLastSeen,
  updateStationError,
} from "../services/stationService";
import { touchPresence } from "./chargerPresence";
import {
  createTransaction,
  stopTransaction,
  updateTransactionEnergy,
  promotePendingToCharging,
  closeOpenTransactionFromExternalStatus,
  getOpenTransactionForConnector,
  getTransactionMeterSnapshot,
  setTransactionPaused,
  resumeTransactionFromPaused,
} from "../services/transactionService";
import {
  ensureConnectorsForStation,
  ensureConnectorsUpTo,
  updateConnectorStatus,
  setConnectorTransaction,
} from "../services/connectorService";
import {
  parseMeterValuesPayload,
  hasSignificantChargingFlow,
  shouldPromoteFromEnergyRegister,
} from "./meterSample";
import { touchSessionIdleState } from "./sessionIdleMonitor";

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
    void findStationByChargePointId(chargePointId).then(async (s) => {
      if (!s) return;
      const errMsg = "Mensagem OCPP inválida ou JSON malformado";
      await updateStationError(chargePointId, errMsg);
      realtimeEmitter("charger_status_changed", {
        id: String(s.id),
        chargePointId,
        status: "error",
        last_error: errMsg,
      });
    });
    return;
  }
  if (msg.messageTypeId !== 2) {
    const uniqueId = msg.uniqueId || tryExtractUniqueId(data);
    if (uniqueId) {
      sendCallError(ws, uniqueId, "FormationViolation", `Tipo de mensagem inválido: ${msg.messageTypeId} (esperado 2=CALL)`);
    }
    console.warn(`[OCPP] Mensagem ignorada (${chargePointId}): tipo ${msg.messageTypeId}`);
    void findStationByChargePointId(chargePointId).then(async (s) => {
      if (!s) return;
      const errMsg = `Tipo de mensagem OCPP inválido: ${msg.messageTypeId}`;
      await updateStationError(chargePointId, errMsg);
      realtimeEmitter("charger_status_changed", {
        id: String(s.id),
        chargePointId,
        status: "error",
        last_error: errMsg,
      });
    });
    return;
  }

  touchPresence(chargePointId);

  const { uniqueId, action, payload } = msg;
  console.log(`[OCPP] Mensagem recebida: ${chargePointId} → ${action}`);

  /** Encapsula handler async para capturar erros (ex: Supabase) e enviar InternalError em vez de derrubar */
  const run = (fn: () => Promise<void>) => {
    fn().catch(async (err) => {
      console.error(`[OCPP] Erro em ${action} (${chargePointId}):`, err);
      const s = await findStationByChargePointId(chargePointId);
      if (s) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await updateStationError(chargePointId, `Handler ${action}: ${errMsg}`);
        realtimeEmitter("charger_status_changed", {
          id: String(s.id),
          chargePointId,
          status: "error",
          last_error: errMsg,
        });
      }
      sendCallError(ws, uniqueId, "InternalError", "Erro interno do servidor");
    });
  };

  switch (action) {
    case "BootNotification":
      run(() => handleBootNotification(chargePointId, ws, uniqueId, payload));
      break;
    case "Heartbeat":
      run(() => handleHeartbeat(chargePointId, ws, uniqueId));
      break;
    case "Authorize":
      run(() => handleAuthorize(chargePointId, ws, uniqueId, payload));
      break;
    case "StatusNotification":
      run(() => handleStatusNotification(chargePointId, ws, uniqueId, payload));
      break;
    case "StartTransaction":
      run(() => handleStartTransaction(chargePointId, ws, uniqueId, payload));
      break;
    case "StopTransaction":
      run(() => handleStopTransaction(chargePointId, ws, uniqueId, payload));
      break;
    case "MeterValues":
      run(() => handleMeterValues(chargePointId, ws, uniqueId, payload));
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
    const connectorCount = station.connector_count != null ? Number(station.connector_count) : 0;
    if (connectorCount > 0) {
      await ensureConnectorsForStation(Number(station.id), connectorCount);
      console.log(`[OCPP] Using predefined connector count: ${connectorCount}`);
    }
  } else {
    console.warn(`[OCPP] Estação não cadastrada: ${chargePointId}`);
  }

  const response = {
    status: "Accepted" as const,
    currentTime: new Date().toISOString(),
    /** Intervalo de Heartbeat OCPP (s); alinhado ao timeout de inatividade do backend */
    interval: 60,
  };

  sendCallResult(ws, uniqueId, response);
  realtimeEmitter("charge_point_connected", { chargePointId, action: "BootNotification" });
  if (station) {
    realtimeEmitter("charger_status_changed", {
      id: String(station.id),
      chargePointId,
      status: "online",
    });
  }
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
  const p = payload as { connectorId?: number; status?: string } | undefined;
  const connectorId = p?.connectorId ?? 0;
  const status = p?.status ?? "Available";

  /** Conector: available | charging | unavailable | error (não usar "online" na boca) */
  const connectorStatusMap: Record<string, string> = {
    Available: "available",
    Preparing: "unavailable",
    Charging: "charging",
    SuspendedEV: "unavailable",
    SuspendedEVSE: "unavailable",
    Finishing: "unavailable",
    Reserved: "unavailable",
    Unavailable: "unavailable",
    Faulted: "error",
  };
  const dbStatus = connectorStatusMap[status] ?? "available";

  const station = await findStationByChargePointId(chargePointId);
  if (station) {
    await updateStationLastSeen(chargePointId);
    if (connectorId >= 1) {
      await ensureConnectorsUpTo(Number(station.id), connectorId);
      await updateConnectorStatus(Number(station.id), connectorId, dbStatus);

      if (["Available", "Finishing", "SuspendedEV"].includes(status)) {
        await closeOpenTransactionFromExternalStatus(chargePointId, Number(station.id), connectorId);
      }
      if (status === "Charging") {
        const open = await getOpenTransactionForConnector(Number(station.id), connectorId);
        if (open?.status === "pending") {
          await promotePendingToCharging(open.ocpp_transaction_id, chargePointId);
          touchSessionIdleState(open.ocpp_transaction_id, true, chargePointId);
        }
      }

      realtimeEmitter("connector_update", {
        chargePointId,
        stationId: station.id,
        connectorId,
        status: dbStatus,
      });
    }
    realtimeEmitter("status_notification", { chargePointId, ocppConnectorStatus: status, connectorStatus: dbStatus });
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
      await setConnectorTransaction(Number(station.id), connectorId, ocppTransactionId);
      await updateConnectorStatus(Number(station.id), connectorId, "unavailable");
      realtimeEmitter("connector_update", {
        chargePointId,
        stationId: station.id,
        connectorId,
        current_transaction_id: ocppTransactionId,
      });
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
  console.log(
    `[OCPP] StartTransaction registrado (pending até fluxo real): ${chargePointId} | connector=${connectorId} | txId=${ocppTransactionId}`
  );
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
      await setConnectorTransaction(result.stationId, result.connectorId, null);
      realtimeEmitter("connector_update", {
        chargePointId,
        stationId: result.stationId,
        connectorId: result.connectorId,
        current_transaction_id: null,
        energy_kwh: energyKwh,
      });
      const label = energyKwh <= 0 ? "cancelada (sem consumo real)" : "finalizada";
      console.log(
        `[OCPP] StopTransaction ${label}: ${chargePointId} | txId=${ocppTransactionId} | energia=${energyKwh.toFixed(2)} kWh`
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

  const sample = parseMeterValuesPayload(payload);
  let ocppTransactionId = sample.transactionId;

  const p = payload as { connectorId?: number } | undefined;
  const connectorIdFromPayload =
    p?.connectorId != null ? Number(p.connectorId) : sample.connectorId != null ? sample.connectorId : 0;

  if (ocppTransactionId == null && station && connectorIdFromPayload >= 1) {
    const open = await getOpenTransactionForConnector(Number(station.id), connectorIdFromPayload);
    if (open) {
      ocppTransactionId = open.ocpp_transaction_id;
    }
  }

  if (ocppTransactionId == null) {
    sendCallResult(ws, uniqueId, {});
    return;
  }

  const snap = await getTransactionMeterSnapshot(ocppTransactionId);
  if (!snap) {
    sendCallResult(ws, uniqueId, {});
    return;
  }

  const meterStartWh = snap.meter_start;
  const energyWh = sample.energyWh;

  const ongoingEnergyImport =
    energyWh != null && energyWh >= meterStartWh + 1;

  const flowSignificant =
    hasSignificantChargingFlow(sample) ||
    shouldPromoteFromEnergyRegister(meterStartWh, energyWh) ||
    ongoingEnergyImport;

  if (snap.status === "pending" && flowSignificant) {
    await promotePendingToCharging(ocppTransactionId, chargePointId);
  }

  if (energyWh != null) {
    const result = await updateTransactionEnergy(ocppTransactionId, energyWh);
    if (result && station) {
      realtimeEmitter("connector_update", {
        chargePointId,
        stationId: result.stationId,
        connectorId: result.connectorId,
        energy_kwh: result.energyKwh,
      });
    }
  }

  const after = await getTransactionMeterSnapshot(ocppTransactionId);
  const currentStatus = after?.status ?? snap.status;

  if (currentStatus === "charging" && !flowSignificant) {
    await setTransactionPaused(ocppTransactionId);
  } else if (currentStatus === "paused" && flowSignificant) {
    await resumeTransactionFromPaused(ocppTransactionId);
  }

  touchSessionIdleState(ocppTransactionId, flowSignificant, chargePointId);

  const sid = snap.station_id;
  const cid = snap.connector_id;
  if (sid >= 1 && cid >= 1) {
    if (flowSignificant) {
      await updateConnectorStatus(sid, cid, "charging");
    } else if (currentStatus === "charging" || currentStatus === "paused") {
      await updateConnectorStatus(sid, cid, "unavailable");
    }
  }

  sendCallResult(ws, uniqueId, {});
}

import { getSupabase } from "../database/supabaseClient";
import { addStationKwh, incrementStationSessions } from "./stationService";
import { updateConnectorEnergy, setConnectorTransaction } from "./connectorService";
import { emitRealtime } from "../realtime/websocketServer";
import { clearSessionIdleTimer } from "../ocpp/sessionIdleRegistry";

export type TransactionSessionStatus =
  | "pending"
  | "charging"
  | "paused"
  | "completed"
  | "cancelled";

export interface TransactionRow {
  id: string;
  ocpp_transaction_id: number;
  station_id: number;
  charge_point_id: string;
  connector_id: number;
  start_time: string;
  end_time: string | null;
  meter_start: number;
  meter_stop: number | null;
  energy_kwh: number;
  status: string;
  created_at: string;
  last_energy_flow_at?: string | null;
}

const MIN_REAL_ENERGY_KWH = Number(process.env.OCPP_MIN_SESSION_ENERGY_KWH ?? 0.01);

/** Cria transação em pending — não incrementa sessões até haver carregamento real */
export async function createTransaction(
  chargePointId: string,
  stationId: number,
  connectorId: number,
  meterStart: number,
  ocppTransactionId: number
): Promise<TransactionRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      ocpp_transaction_id: ocppTransactionId,
      station_id: stationId,
      charge_point_id: chargePointId,
      connector_id: connectorId,
      meter_start: meterStart,
      start_time: new Date().toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[transactionService] createTransaction error:", error);
    return null;
  }

  return data as unknown as TransactionRow;
}

/** Primeiro fluxo real (MeterValues / StatusNotification Charging) → sessão válida */
export async function promotePendingToCharging(
  ocppTransactionId: number,
  chargePointId: string
): Promise<TransactionRow | null> {
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .eq("status", "pending")
    .single();

  if (fetchError || !tx) return null;

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("transactions")
    .update({
      status: "charging",
      last_energy_flow_at: now,
    })
    .eq("ocpp_transaction_id", ocppTransactionId)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !updated) return null;

  await incrementStationSessions(chargePointId);

  emitRealtime("session_promoted_to_charging", {
    chargePointId,
    ocpp_transaction_id: ocppTransactionId,
  });

  return updated as unknown as TransactionRow;
}

export async function setTransactionPaused(ocppTransactionId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("transactions")
    .update({ status: "paused" })
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["charging"]);
  return !error;
}

export async function resumeTransactionFromPaused(ocppTransactionId: number): Promise<boolean> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("transactions")
    .update({ status: "charging", last_energy_flow_at: now })
    .eq("ocpp_transaction_id", ocppTransactionId)
    .eq("status", "paused");
  return !error;
}

/** StopTransaction ou encerramento manual */
export async function stopTransaction(
  ocppTransactionId: number,
  meterStop: number
): Promise<{ energyKwh: number; chargePointId: string; stationId: number; connectorId: number } | null> {
  clearSessionIdleTimer(ocppTransactionId);
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("id, charge_point_id, meter_start, station_id, connector_id, status, energy_kwh")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["pending", "charging", "paused"])
    .single();

  if (fetchError || !tx) {
    console.warn("[transactionService] stopTransaction: transação não encontrada:", ocppTransactionId);
    return null;
  }

  const meterStart = Number(tx.meter_start) || 0;
  const energyKwh = Math.max(0, (meterStop - meterStart) / 1000);
  const storedEnergy = Number(tx.energy_kwh) || 0;
  const finalEnergy = Math.max(energyKwh, storedEnergy);

  const isPhantom = finalEnergy < MIN_REAL_ENERGY_KWH;

  if (isPhantom) {
    const { error: upErr } = await supabase
      .from("transactions")
      .update({
        meter_stop: meterStop,
        end_time: new Date().toISOString(),
        energy_kwh: finalEnergy,
        status: "cancelled",
      })
      .eq("ocpp_transaction_id", ocppTransactionId);

    if (upErr) {
      console.error("[transactionService] stopTransaction cancel phantom:", upErr);
      return null;
    }

    return {
      energyKwh: 0,
      chargePointId: tx.charge_point_id as string,
      stationId: Number(tx.station_id),
      connectorId: Number(tx.connector_id),
    };
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      meter_stop: meterStop,
      end_time: new Date().toISOString(),
      energy_kwh: finalEnergy,
      status: "completed",
    })
    .eq("ocpp_transaction_id", ocppTransactionId);

  if (updateError) {
    console.error("[transactionService] stopTransaction update error:", updateError);
    return null;
  }

  if (finalEnergy > 0) {
    await addStationKwh(tx.charge_point_id as string, finalEnergy);
  }

  return {
    energyKwh: finalEnergy,
    chargePointId: tx.charge_point_id as string,
    stationId: Number(tx.station_id),
    connectorId: Number(tx.connector_id),
  };
}

/** Sem fluxo por OCPP_SESSION_IDLE_MS — pending vira cancelled; charging completa ou cancela conforme energia */
export async function finalizeTransactionIdleTimeout(
  ocppTransactionId: number,
  chargePointId: string
): Promise<void> {
  clearSessionIdleTimer(ocppTransactionId);
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["charging", "paused", "pending"])
    .single();

  if (fetchError || !tx) return;

  const rowStatus = String(tx.status);

  if (rowStatus === "pending") {
    const meterStart = Number(tx.meter_start) || 0;
    const { error: upErr } = await supabase
      .from("transactions")
      .update({
        meter_stop: meterStart,
        end_time: new Date().toISOString(),
        energy_kwh: 0,
        status: "cancelled",
      })
      .eq("ocpp_transaction_id", ocppTransactionId)
      .eq("status", "pending");

    if (upErr) {
      console.error("[transactionService] finalizeTransactionIdleTimeout pending:", upErr);
      return;
    }

    const stationId = Number(tx.station_id);
    const connectorId = Number(tx.connector_id);
    await setConnectorTransaction(stationId, connectorId, null);

    emitRealtime("connector_update", {
      chargePointId,
      stationId,
      connectorId,
      current_transaction_id: null,
      energy_kwh: 0,
    });
    emitRealtime("stop_transaction", { chargePointId, reason: "idle_timeout_pending" });

    console.log(
      `[OCPP] Transação pending cancelada por idle (sem fluxo): ${chargePointId} | tx=${ocppTransactionId}`
    );
    return;
  }

  const energyKwh = Math.max(0, Number(tx.energy_kwh) || 0);
  const meterStart = Number(tx.meter_start) || 0;
  const meterStop = meterStart + Math.round(energyKwh * 1000);

  const finalStatus = energyKwh >= MIN_REAL_ENERGY_KWH ? "completed" : "cancelled";

  const { error: upErr } = await supabase
    .from("transactions")
    .update({
      meter_stop: meterStop,
      end_time: new Date().toISOString(),
      energy_kwh: energyKwh,
      status: finalStatus,
    })
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["charging", "paused"]);

  if (upErr) {
    console.error("[transactionService] finalizeTransactionIdleTimeout:", upErr);
    return;
  }

  if (finalStatus === "completed" && energyKwh > 0) {
    await addStationKwh(chargePointId, energyKwh);
  }

  const stationId = Number(tx.station_id);
  const connectorId = Number(tx.connector_id);
  await setConnectorTransaction(stationId, connectorId, null);

  emitRealtime("connector_update", {
    chargePointId,
    stationId,
    connectorId,
    current_transaction_id: null,
    energy_kwh: energyKwh,
  });
  emitRealtime("stop_transaction", { chargePointId, reason: "idle_timeout" });

  console.log(
    `[OCPP] Sessão encerrada por idle: ${chargePointId} | tx=${ocppTransactionId} | status=${finalStatus} | kWh=${energyKwh.toFixed(3)}`
  );
}

/** Encerra transação aberta quando StatusNotification indica fim (Available, Finishing, SuspendedEV) */
export async function closeOpenTransactionFromExternalStatus(
  chargePointId: string,
  stationId: number,
  connectorId: number
): Promise<void> {
  const open = await getOpenTransactionForConnector(stationId, connectorId);
  if (!open) return;

  clearSessionIdleTimer(open.ocpp_transaction_id);

  const supabase = getSupabase();
  const { data: tx, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("ocpp_transaction_id", open.ocpp_transaction_id)
    .single();

  if (fetchErr || !tx) return;

  const meterStart = Number(tx.meter_start) || 0;
  const energyKwh = Number(tx.energy_kwh) || 0;
  const meterStop = meterStart + Math.round(energyKwh * 1000);

  const result = await stopTransaction(open.ocpp_transaction_id, meterStop);
  if (!result) return;

  await setConnectorTransaction(stationId, connectorId, null);

  emitRealtime("connector_update", {
    chargePointId,
    stationId,
    connectorId,
    current_transaction_id: null,
    energy_kwh: result.energyKwh,
  });
  emitRealtime("stop_transaction", { chargePointId, reason: "status_notification" });
}

export async function updateTransactionEnergy(
  ocppTransactionId: number,
  meterValueWh: number
): Promise<{ stationId: number; connectorId: number; energyKwh: number } | null> {
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("meter_start, station_id, connector_id, status")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["pending", "charging", "paused"])
    .single();

  if (fetchError || !tx) return null;

  const meterStart = Number(tx.meter_start) || 0;
  const energyKwh = Math.max(0, (meterValueWh - meterStart) / 1000);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { energy_kwh: energyKwh };
  if (tx.status === "charging" || tx.status === "paused") {
    updates.last_energy_flow_at = now;
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update(updates)
    .eq("ocpp_transaction_id", ocppTransactionId);

  if (updateError) return null;

  const stationId = Number(tx.station_id);
  const connectorId = Number(tx.connector_id);
  await updateConnectorEnergy(stationId, connectorId, energyKwh);
  return { stationId, connectorId, energyKwh };
}

export async function touchLastEnergyFlow(ocppTransactionId: number): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("transactions")
    .update({ last_energy_flow_at: new Date().toISOString() })
    .eq("ocpp_transaction_id", ocppTransactionId)
    .in("status", ["charging", "paused"]);
}

export async function getTransactionMeterSnapshot(
  ocppTransactionId: number
): Promise<{ status: string; meter_start: number; connector_id: number; station_id: number } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("transactions")
    .select("status, meter_start, connector_id, station_id")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    status: String(data.status),
    meter_start: Number(data.meter_start) || 0,
    connector_id: Number(data.connector_id) || 0,
    station_id: Number(data.station_id) || 0,
  };
}

export async function getOpenTransactionForConnector(
  stationId: number,
  connectorId: number
): Promise<{ ocpp_transaction_id: number; status: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("transactions")
    .select("ocpp_transaction_id, status")
    .eq("station_id", stationId)
    .eq("connector_id", connectorId)
    .in("status", ["pending", "charging", "paused"])
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ocpp_transaction_id: Number(data.ocpp_transaction_id),
    status: String(data.status),
  };
}

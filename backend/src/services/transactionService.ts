import { getSupabase } from "../database/supabaseClient";
import { addStationKwh } from "./stationService";

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
}

/** Cria nova transação (StartTransaction) */
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
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("[transactionService] createTransaction error:", error);
    return null;
  }

  return data as unknown as TransactionRow;
}

/** Finaliza transação e calcula energia (StopTransaction) */
export async function stopTransaction(
  ocppTransactionId: number,
  meterStop: number
): Promise<{ energyKwh: number; chargePointId: string } | null> {
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("id, charge_point_id, meter_start")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .eq("status", "active")
    .single();

  if (fetchError || !tx) {
    console.warn("[transactionService] stopTransaction: transação não encontrada:", ocppTransactionId);
    return null;
  }

  const meterStart = Number(tx.meter_start) || 0;
  const energyKwh = Math.max(0, (meterStop - meterStart) / 1000);

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      meter_stop: meterStop,
      end_time: new Date().toISOString(),
      energy_kwh: energyKwh,
      status: "completed",
    })
    .eq("ocpp_transaction_id", ocppTransactionId);

  if (updateError) {
    console.error("[transactionService] stopTransaction update error:", updateError);
    return null;
  }

  if (energyKwh > 0) {
    await addStationKwh(tx.charge_point_id as string, energyKwh);
  }

  return { energyKwh, chargePointId: tx.charge_point_id as string };
}

/** Atualiza energia parcial (MeterValues durante carregamento) */
export async function updateTransactionEnergy(
  ocppTransactionId: number,
  meterValue: number
): Promise<boolean> {
  const supabase = getSupabase();
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("meter_start")
    .eq("ocpp_transaction_id", ocppTransactionId)
    .eq("status", "active")
    .single();

  if (fetchError || !tx) return false;

  const meterStart = Number(tx.meter_start) || 0;
  const energyKwh = Math.max(0, (meterValue - meterStart) / 1000);

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ energy_kwh: energyKwh })
    .eq("ocpp_transaction_id", ocppTransactionId);

  return !updateError;
}

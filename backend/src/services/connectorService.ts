import { getSupabase } from "../database/supabaseClient";

const VALID_CONNECTOR_STATUSES = [
  "available",
  "charging",
  "offline",
  "online",
  "faulted",
  "unavailable",
  "reserved",
  "preparing",
  "finishing",
] as const;

export interface ConnectorRow {
  id: string;
  station_id: number;
  connector_id: number;
  status: string;
  power_kw: number;
  energy_kwh: number;
  current_transaction_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cria conectores 1..count para uma estação se nenhum existir (usado quando connector_count está definido).
 * Não sobrescreve conectores já existentes.
 */
export async function ensureConnectorsForStation(
  stationId: number,
  count: number
): Promise<void> {
  if (count < 1) return;
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("connectors")
    .select("id")
    .eq("station_id", stationId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const inserts = Array.from({ length: count }, (_, i) => ({
    station_id: stationId,
    connector_id: i + 1,
    status: "available",
    power_kw: 0,
    energy_kwh: 0,
    current_transaction_id: null,
  }));

  await supabase.from("connectors").insert(inserts);
}

/**
 * Garante que existam conectores 1..maxConnectorId para a estação.
 * Cria apenas os que faltam (fallback dinâmico via StatusNotification).
 * Loga "Connector detected dynamically: X" para cada conector criado.
 */
export async function ensureConnectorsUpTo(
  stationId: number,
  maxConnectorId: number
): Promise<void> {
  if (maxConnectorId < 1) return;
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("connectors")
    .select("connector_id")
    .eq("station_id", stationId);

  const existingIds = new Set((existing ?? []).map((r: { connector_id: number }) => r.connector_id));

  for (let id = 1; id <= maxConnectorId; id++) {
    if (existingIds.has(id)) continue;
    await supabase.from("connectors").insert({
      station_id: stationId,
      connector_id: id,
      status: "available",
      power_kw: 0,
      energy_kwh: 0,
      current_transaction_id: null,
    });
    console.log(`[OCPP] Connector detected dynamically: ${id}`);
    existingIds.add(id);
  }
}

/** Cria conector se não existir (ex: StatusNotification para connectorId novo). Retorna true se criou. */
async function ensureConnectorExists(stationId: number, connectorId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("connectors")
    .select("id")
    .eq("station_id", stationId)
    .eq("connector_id", connectorId)
    .maybeSingle();

  if (!data) {
    await supabase.from("connectors").insert({
      station_id: stationId,
      connector_id: connectorId,
      status: "available",
      power_kw: 0,
      energy_kwh: 0,
      current_transaction_id: null,
    });
    return true;
  }
  return false;
}

/** Atualiza status do conector (StatusNotification) */
export async function updateConnectorStatus(
  stationId: number,
  connectorId: number,
  status: string
): Promise<boolean> {
  await ensureConnectorExists(stationId, connectorId);
  const normalized = VALID_CONNECTOR_STATUSES.includes(status as (typeof VALID_CONNECTOR_STATUSES)[number])
    ? status
    : "available";
  const supabase = getSupabase();
  const { error } = await supabase
    .from("connectors")
    .update({
      status: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("station_id", stationId)
    .eq("connector_id", connectorId);

  return !error;
}

/** Define transação ativa no conector (StartTransaction / StopTransaction) */
export async function setConnectorTransaction(
  stationId: number,
  connectorId: number,
  ocppTransactionId: number | null
): Promise<boolean> {
  await ensureConnectorExists(stationId, connectorId);
  const supabase = getSupabase();
  const { error } = await supabase
    .from("connectors")
    .update({
      current_transaction_id: ocppTransactionId,
      updated_at: new Date().toISOString(),
    })
    .eq("station_id", stationId)
    .eq("connector_id", connectorId);

  return !error;
}

/** Atualiza energia consumida no conector (MeterValues) */
export async function updateConnectorEnergy(
  stationId: number,
  connectorId: number,
  energyKwh: number
): Promise<boolean> {
  await ensureConnectorExists(stationId, connectorId);
  const supabase = getSupabase();
  const { error } = await supabase
    .from("connectors")
    .update({
      energy_kwh: energyKwh,
      updated_at: new Date().toISOString(),
    })
    .eq("station_id", stationId)
    .eq("connector_id", connectorId);

  return !error;
}

/** Lista conectores de uma estação */
export async function listConnectorsByStation(stationId: number): Promise<ConnectorRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("connectors")
    .select("*")
    .eq("station_id", stationId)
    .order("connector_id");

  if (error) return [];
  return (data ?? []) as ConnectorRow[];
}

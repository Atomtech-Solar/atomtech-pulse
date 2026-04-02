import { getSupabase } from "../database/supabaseClient";
import {
  listConnectorsByStation,
  ensureConnectorsForStation,
  setAllConnectorsStatus,
} from "./connectorService";

/** Status da estação = apenas conexão WebSocket / erro de infra (não estado da boca) */
export const VALID_STATUSES = ["offline", "online", "error"] as const;

export type StationStatus = (typeof VALID_STATUSES)[number];

export interface StationRow {
  id: number | string;
  name: string;
  charge_point_id: string;
  company_id: number;
  status: string;
  last_seen: string | null;
  last_error?: string | null;
  connection_type?: string | null;
  ocpp_host?: string | null;
  ocpp_port?: number | null;
  charge_point_vendor?: string | null;
  charge_point_model?: string | null;
  city: string | null;
  uf: string | null;
  total_kwh: number;
  total_sessions: number;
  created_at: string;
  connector_count?: number | null;
}

export interface CreateStationInput {
  company_id: number;
  name: string;
  charge_point_id: string;
  city?: string | null;
  uf?: string | null;
  lat?: number | null;
  lng?: number | null;
  charge_point_vendor?: string | null;
  charge_point_model?: string | null;
  connector_count?: number | null;
  connection_type?: "ws" | "wss" | null;
  ocpp_host?: string | null;
  ocpp_port?: number | null;
}

/** Sessão recente da estação (transação OCPP) */
export type StationSession = {
  transaction_id: string | number;
  connector_id: number;
  start_time: string;
  stop_time: string | null;
  energy_kwh: number;
};

/** Busca estação por charge_point_id (para OCPP - usa SERVICE_ROLE) */
export async function findStationByChargePointId(
  chargePointId: string
): Promise<StationRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stations")
    .select(
      "id, charge_point_id, company_id, name, status, last_seen, last_error, connection_type, ocpp_host, ocpp_port, charge_point_vendor, charge_point_model, total_kwh, total_sessions, connector_count"
    )
    .eq("charge_point_id", chargePointId)
    .single();

  if (error || !data) return null;
  return data as unknown as StationRow;
}

/** Atualiza status e last_seen (BootNotification, conexão). Limpa último erro ao reconectar. */
export async function updateStationOnline(chargePointId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: before } = await supabase
    .from("stations")
    .select("id, status")
    .eq("charge_point_id", chargePointId)
    .maybeSingle();

  const { error } = await supabase
    .from("stations")
    .update({ status: "online", last_seen: new Date().toISOString(), last_error: null })
    .eq("charge_point_id", chargePointId);

  if (error) return false;

  const sid = before?.id != null ? Number(before.id) : null;
  const prev = String(before?.status ?? "");
  if (sid != null && (prev === "offline" || prev === "error")) {
    await setAllConnectorsStatus(sid, "unavailable");
  }
  return true;
}

/** Atualiza status, last_seen, vendor e model (BootNotification completo) */
export async function updateStationBootInfo(
  chargePointId: string,
  vendor?: string | null,
  model?: string | null
): Promise<boolean> {
  const updates: Record<string, unknown> = {
    status: "online",
    last_seen: new Date().toISOString(),
    last_error: null,
  };
  if (vendor != null && vendor !== "") updates.charge_point_vendor = String(vendor).slice(0, 50);
  if (model != null && model !== "") updates.charge_point_model = String(model).slice(0, 50);

  const supabase = getSupabase();
  const { error } = await supabase
    .from("stations")
    .update(updates)
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Marca estação como offline (desconexão WebSocket) e todas as bocas como indisponíveis */
export async function updateStationOffline(chargePointId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: station } = await supabase
    .from("stations")
    .select("id")
    .eq("charge_point_id", chargePointId)
    .maybeSingle();

  const { error } = await supabase
    .from("stations")
    .update({ status: "offline" })
    .eq("charge_point_id", chargePointId);

  if (error) return false;
  if (station?.id != null) {
    await setAllConnectorsStatus(Number(station.id), "unavailable");
  }
  return true;
}

const MAX_LAST_ERROR_LEN = 2000;

/** Erro geral de infra (socket, protocolo); bocas refletem indisponibilidade */
export async function updateStationError(chargePointId: string, message: string): Promise<boolean> {
  const supabase = getSupabase();
  const text = String(message).slice(0, MAX_LAST_ERROR_LEN);
  const { data: station } = await supabase
    .from("stations")
    .select("id")
    .eq("charge_point_id", chargePointId)
    .maybeSingle();

  const { error } = await supabase
    .from("stations")
    .update({ status: "error", last_error: text })
    .eq("charge_point_id", chargePointId);

  if (error) return false;
  if (station?.id != null) {
    await setAllConnectorsStatus(Number(station.id), "error");
  }
  return true;
}

export type RealtimeEmitFn = (event: string, data: unknown) => void;

/**
 * Marca como offline estações com last_seen antigo (servidor reiniciado, TCP sem fechar, etc.).
 */
export async function markIdleStationsOffline(
  idleSeconds: number,
  emit?: RealtimeEmitFn
): Promise<void> {
  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - idleSeconds * 1000).toISOString();
  const { data: rows, error } = await supabase
    .from("stations")
    .select("id, charge_point_id, status")
    .eq("status", "online")
    .lt("last_seen", cutoff);

  if (error) {
    console.error("[stationService] markIdleStationsOffline:", error);
    return;
  }

  for (const row of rows ?? []) {
    const id = row.id as number;
    const cpId = String(row.charge_point_id ?? "");
    const { error: upErr } = await supabase.from("stations").update({ status: "offline" }).eq("id", id);
    if (!upErr) {
      await setAllConnectorsStatus(id, "unavailable");
      emit?.("charger_status_changed", {
        id: String(id),
        chargePointId: cpId,
        status: "offline",
        reason: "idle_timeout",
      });
    }
  }
}

/** Atualiza apenas last_seen (Heartbeat) */
export async function updateStationLastSeen(chargePointId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("stations")
    .update({ last_seen: new Date().toISOString() })
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Incrementa total_sessions (StartTransaction) */
export async function incrementStationSessions(chargePointId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: station } = await supabase
    .from("stations")
    .select("total_sessions")
    .eq("charge_point_id", chargePointId)
    .single();

  if (!station) return false;

  const newTotal = (Number(station.total_sessions) || 0) + 1;
  const { error } = await supabase
    .from("stations")
    .update({ total_sessions: newTotal })
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Adiciona kWh à estação (StopTransaction/MeterValues) */
export async function addStationKwh(
  chargePointId: string,
  kwhToAdd: number
): Promise<boolean> {
  if (kwhToAdd <= 0) return true;

  const supabase = getSupabase();
  const { data: station } = await supabase
    .from("stations")
    .select("total_kwh")
    .eq("charge_point_id", chargePointId)
    .single();

  if (!station) return false;

  const current = Number(station.total_kwh) || 0;
  const { error } = await supabase
    .from("stations")
    .update({ total_kwh: current + kwhToAdd })
    .eq("charge_point_id", chargePointId);

  return !error;
}

export interface StationWithConnectors extends StationRow {
  connectors: Array<{
    connector_id: number;
    status: string;
    energy_kwh: number;
    power_kw: number;
    current_transaction_id: number | null;
  }>;
}

/** Busca estação por ID com conectores e últimas transações (GET /stations/:station_id) */
export async function getStationByIdWithDetails(
  stationId: string | number
): Promise<{
  station_id: string | number;
  charge_point_id: string;
  vendor: string | null;
  model: string | null;
  firmware: string | null;
  status: string;
  last_seen: string | null;
  total_sessions: number;
  total_kwh: number;
  connectors: Array<{
    connector_id: number;
    status: string;
    energy_kwh: number;
    power_kw: number;
    current_transaction_id: number | null;
  }>;
  recent_sessions?: StationSession[];
} | null> {
  const id = Number(stationId);
  if (Number.isNaN(id)) return null;

  const supabase = getSupabase();
  const { data: station, error: stationError } = await supabase
    .from("stations")
    .select("id, charge_point_id, charge_point_vendor, charge_point_model, status, last_seen, total_kwh, total_sessions")
    .eq("id", id)
    .single();

  if (stationError || !station) return null;

  const connectors = await listConnectorsByStation(id);

  const { data: txData } = await supabase
    .from("transactions")
    .select("ocpp_transaction_id, start_time, end_time, energy_kwh, connector_id")
    .eq("station_id", id)
    .order("start_time", { ascending: false })
    .limit(10);

  const s = station as Record<string, unknown>;
  return {
    station_id: s.id as string | number,
    charge_point_id: String(s.charge_point_id ?? ""),
    vendor: s.charge_point_vendor ? String(s.charge_point_vendor) : null,
    model: s.charge_point_model ? String(s.charge_point_model) : null,
    firmware: null,
    status: String(s.status ?? "offline"),
    last_seen: s.last_seen ? String(s.last_seen) : null,
    total_sessions: Number(s.total_sessions) ?? 0,
    total_kwh: Number(s.total_kwh) ?? 0,
    connectors: connectors.map((c) => ({
      connector_id: c.connector_id,
      status: c.status,
      energy_kwh: Number(c.energy_kwh) ?? 0,
      power_kw: Number(c.power_kw) ?? 0,
      current_transaction_id: c.current_transaction_id,
    })),
    recent_sessions: (txData ?? []).map((row: Record<string, unknown>): StationSession => ({
      transaction_id: (row.ocpp_transaction_id ?? row.id) as string | number,
      connector_id: Number(row.connector_id),
      start_time: String(row.start_time ?? ""),
      stop_time: row.end_time ? String(row.end_time) : null,
      energy_kwh: Number(row.energy_kwh) ?? 0,
    })),
  };
}

/** Lista todas as estações com conectores (para GET /stations) */
export async function listStationsWithConnectors(): Promise<StationWithConnectors[]> {
  const stations = await listStations();
  const result: StationWithConnectors[] = [];

  for (const s of stations) {
    const connectors = await listConnectorsByStation(Number(s.id));
    result.push({
      ...s,
      connectors: connectors.map((c) => ({
        connector_id: c.connector_id,
        status: c.status,
        energy_kwh: Number(c.energy_kwh) ?? 0,
        power_kw: Number(c.power_kw) ?? 0,
        current_transaction_id: c.current_transaction_id,
      })),
    });
  }

  return result;
}

/** Lista todas as estações (sem conectores) */
export async function listStations(): Promise<StationRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stations")
    .select("id, name, charge_point_id, company_id, status, last_seen, charge_point_vendor, charge_point_model, city, uf, total_kwh, total_sessions, created_at")
    .not("charge_point_id", "is", null)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: String(row.name ?? ""),
    charge_point_id: String(row.charge_point_id ?? ""),
    company_id: row.company_id,
    status: String(row.status ?? "offline"),
    last_seen: row.last_seen ? String(row.last_seen) : null,
    charge_point_vendor: row.charge_point_vendor ? String(row.charge_point_vendor) : null,
    charge_point_model: row.charge_point_model ? String(row.charge_point_model) : null,
    city: row.city ? String(row.city) : null,
    uf: row.uf ? String(row.uf) : null,
    total_kwh: Number(row.total_kwh) ?? 0,
    total_sessions: Number(row.total_sessions) ?? 0,
    created_at: String(row.created_at ?? ""),
  })) as StationRow[];
}

/** Cria estação (POST /stations) - status sempre offline. Se connector_count > 0, cria os conectores. */
export async function createStation(input: CreateStationInput): Promise<StationRow> {
  const insert: Record<string, unknown> = {
    company_id: input.company_id,
    name: input.name.trim(),
    charge_point_id: input.charge_point_id.trim(),
    city: input.city?.trim() || null,
    uf: input.uf?.trim().toUpperCase().slice(0, 2) || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    charge_point_vendor: input.charge_point_vendor?.trim() || null,
    charge_point_model: input.charge_point_model?.trim() || null,
    status: "offline",
    connection_type: input.connection_type === "ws" ? "ws" : "wss",
    ocpp_host: input.ocpp_host?.trim() || null,
    ocpp_port: input.ocpp_port != null && input.ocpp_port > 0 ? input.ocpp_port : null,
  };
  if (input.connector_count != null && input.connector_count > 0) {
    insert.connector_count = input.connector_count;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.from("stations").insert(insert).select().single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("Charge Point ID já cadastrado.");
    }
    throw error;
  }

  const row = data as Record<string, unknown>;
  const connectorCount = row.connector_count != null ? Number(row.connector_count) : 0;
  if (connectorCount > 0) {
    await ensureConnectorsForStation(Number(row.id), connectorCount);
    console.log(`[OCPP] Using predefined connector count: ${connectorCount}`);
  }

  return data as unknown as StationRow;
}

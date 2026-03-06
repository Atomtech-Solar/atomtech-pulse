import { supabase } from "../database/supabaseClient";

export const VALID_STATUSES = [
  "offline",
  "online",
  "charging",
  "faulted",
  "unavailable",
] as const;

export type StationStatus = (typeof VALID_STATUSES)[number];

export interface StationRow {
  id: number | string;
  name: string;
  charge_point_id: string;
  company_id: number;
  status: string;
  last_seen: string | null;
  city: string | null;
  uf: string | null;
  total_kwh: number;
  total_sessions: number;
  created_at: string;
}

export interface CreateStationInput {
  company_id: number;
  name: string;
  charge_point_id: string;
  city?: string | null;
  uf?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/** Busca estação por charge_point_id (para OCPP - usa SERVICE_ROLE) */
export async function findStationByChargePointId(
  chargePointId: string
): Promise<StationRow | null> {
  const { data, error } = await supabase
    .from("stations")
    .select("id, charge_point_id, company_id, name, status, last_seen, total_kwh, total_sessions")
    .eq("charge_point_id", chargePointId)
    .single();

  if (error || !data) return null;
  return data as unknown as StationRow;
}

/** Atualiza status e last_seen (BootNotification, conexão) */
export async function updateStationOnline(chargePointId: string): Promise<boolean> {
  const { error } = await supabase
    .from("stations")
    .update({ status: "online", last_seen: new Date().toISOString() })
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Atualiza apenas last_seen (Heartbeat) */
export async function updateStationLastSeen(chargePointId: string): Promise<boolean> {
  const { error } = await supabase
    .from("stations")
    .update({ last_seen: new Date().toISOString() })
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Atualiza status (StatusNotification) */
export async function updateStationStatus(
  chargePointId: string,
  status: string
): Promise<boolean> {
  const normalized = VALID_STATUSES.includes(status as StationStatus) ? status : "offline";
  const { error } = await supabase
    .from("stations")
    .update({ status: normalized, last_seen: new Date().toISOString() })
    .eq("charge_point_id", chargePointId);

  return !error;
}

/** Incrementa total_sessions (StartTransaction) */
export async function incrementStationSessions(chargePointId: string): Promise<boolean> {
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

/** Lista todas as estações (para GET /stations) */
export async function listStations(): Promise<StationRow[]> {
  const { data, error } = await supabase
    .from("stations")
    .select("id, name, charge_point_id, company_id, status, last_seen, city, uf, total_kwh, total_sessions, created_at")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: String(row.name ?? ""),
    charge_point_id: String(row.charge_point_id ?? ""),
    company_id: row.company_id,
    status: String(row.status ?? "offline"),
    last_seen: row.last_seen ? String(row.last_seen) : null,
    city: row.city ? String(row.city) : null,
    uf: row.uf ? String(row.uf) : null,
    total_kwh: Number(row.total_kwh) ?? 0,
    total_sessions: Number(row.total_sessions) ?? 0,
    created_at: String(row.created_at ?? ""),
  })) as StationRow[];
}

/** Cria estação (POST /stations) - status sempre offline */
export async function createStation(input: CreateStationInput): Promise<StationRow> {
  const insert = {
    company_id: input.company_id,
    name: input.name.trim(),
    charge_point_id: input.charge_point_id.trim(),
    city: input.city?.trim() || null,
    uf: input.uf?.trim().toUpperCase().slice(0, 2) || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    status: "offline",
  };

  const { data, error } = await supabase.from("stations").insert(insert).select().single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("Charge Point ID já cadastrado.");
    }
    throw error;
  }

  return data as unknown as StationRow;
}

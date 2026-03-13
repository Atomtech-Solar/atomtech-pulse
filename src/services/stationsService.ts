import { supabase } from "@/lib/supabaseClient";
import type { Station } from "@/types/station";
import { sanitizeChargePointId } from "@/lib/chargePointIdUtils";

export type StationStatus = Station["status"];

export type CreateStationInput = {
  name: string;
  charge_point_id: string;
  company_id: number;
  city?: string | null;
  uf?: string | null;
  charge_point_vendor?: string | null;
  charge_point_model?: string | null;
};

const VALID_STATUSES = ["offline", "online", "charging", "faulted", "unavailable"] as const;

const STATUS_ORDER: Record<string, number> = {
  online: 0,
  charging: 1,
  offline: 2,
  unavailable: 3,
  faulted: 4,
};

function mapRowToStation(row: Record<string, unknown>): Station {
  const statusStr = String(row.status || "").toLowerCase();
  const status: Station["status"] =
    VALID_STATUSES.includes(statusStr as Station["status"]) ? (statusStr as Station["status"]) : "offline";
  return {
    id: String(row.id),
    name: String(row.name || ""),
    charge_point_id: String((row as { charge_point_id?: string }).charge_point_id || ""),
    company_id: String(row.company_id || ""),
    status,
    last_seen: row.last_seen ? String(row.last_seen) : null,
    charge_point_vendor: row.charge_point_vendor ? String(row.charge_point_vendor) : null,
    charge_point_model: row.charge_point_model ? String(row.charge_point_model) : null,
    city: row.city ? String(row.city) : null,
    uf: row.uf ? String(row.uf) : null,
    total_kwh: Number(row.total_kwh) ?? 0,
    total_sessions: Number(row.total_sessions) ?? 0,
    created_at: String(row.created_at ?? ""),
  };
}

/**
 * Lista estações reais do Supabase.
 * - Apenas registros com charge_point_id
 * - Ordenado: online/charging primeiro, depois offline
 */
export async function listStations(companyId?: number | null): Promise<Station[]> {
  let query = supabase
    .from("stations")
    .select(
      "id, name, charge_point_id, company_id, status, last_seen, charge_point_vendor, charge_point_model, city, uf, total_kwh, total_sessions, created_at"
    )
    .not("charge_point_id", "is", null)
    .order("name");

  if (companyId != null) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];
  const stations: Station[] = rows.map((row) => mapRowToStation(row));

  // Ordenar: online/charging primeiro, depois offline
  stations.sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 99;
    const orderB = STATUS_ORDER[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return stations;
}

const PG_UNIQUE_VIOLATION = "23505";

/** Cria estação. Status sempre 'offline' (atualizado automaticamente pelo OCPP). */
export async function createStation(input: CreateStationInput): Promise<Station> {
  const sanitized = sanitizeChargePointId(input.charge_point_id.trim());
  if (!sanitized.valid) throw new Error(sanitized.error);

  const insert: Record<string, unknown> = {
    name: input.name.trim(),
    charge_point_id: sanitized.id,
    company_id: input.company_id,
    city: input.city?.trim() || null,
    uf: input.uf?.trim().toUpperCase().slice(0, 2) || null,
    charge_point_vendor: input.charge_point_vendor?.trim().slice(0, 50) || null,
    charge_point_model: input.charge_point_model?.trim().slice(0, 50) || null,
    status: "offline",
  };

  const { data, error } = await supabase.from("stations").insert(insert).select().single();
  if (error) {
    const err = error as { code?: string };
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw new Error("Charge Point ID já cadastrado. Use um valor único.");
    }
    throw error;
  }
  return mapRowToStation(data as Record<string, unknown>);
}

import { supabase } from "@/lib/supabaseClient";
import type { Station } from "@/types/station";
import { sanitizeChargePointId } from "@/lib/chargePointIdUtils";

export type StationStatus = Station["status"]; // offline | online | charging | faulted

export type CreateStationInput = {
  name: string;
  charge_point_id: string;
  company_id: number;
  city?: string | null;
  uf?: string | null;
};

const VALID_STATUSES = ["offline", "online", "charging", "faulted", "unavailable"] as const;

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
    created_at: String(row.created_at || ""),
  };
}

/** Lista estações. RLS filtra por company; super_admin pode filtrar por companyId. */
export async function listStations(companyId?: number | null): Promise<Station[]> {
  let query = supabase
    .from("stations")
    .select("id, name, charge_point_id, company_id, status, created_at")
    .order("name");
  if (companyId != null) {
    query = query.eq("company_id", companyId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRowToStation);
}

/** Código Postgres para violação de unique constraint */
const PG_UNIQUE_VIOLATION = "23505";

/** Cria uma nova estação. status sempre 'offline' (muda só via OCPP). */
export async function createStation(input: CreateStationInput): Promise<Station> {
  const sanitized = sanitizeChargePointId(input.charge_point_id.trim());
  if (!sanitized.valid) {
    throw new Error(sanitized.error);
  }
  const insert: Record<string, unknown> = {
    name: input.name.trim(),
    charge_point_id: sanitized.id,
    company_id: input.company_id,
    city: input.city?.trim() || null,
    uf: input.uf?.trim().toUpperCase().slice(0, 2) || null,
    status: "offline",
  };

  const { data, error } = await supabase.from("stations").insert(insert).select().single();
  if (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw new Error("Charge Point ID já cadastrado. Use um valor único.");
    }
    throw error;
  }
  return mapRowToStation(data as Record<string, unknown>);
}

/** Atualiza o status de uma estação */
export async function updateStationStatus(
  id: string,
  status: StationStatus
): Promise<Station> {
  const { data, error } = await supabase
    .from("stations")
    .update({ status })
    .eq("id", Number(id) || id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToStation(data as Record<string, unknown>);
}

import { supabase } from "@/lib/supabaseClient";
import type { Station } from "@/types/station";

export type StationStatus = Station["status"];

export type CreateStationInput = {
  name: string;
  charge_point_id?: string;
  company_id: number;
  city?: string | null;
  uf?: string | null;
};

function mapRowToStation(row: Record<string, unknown>): Station {
  const statusStr = String(row.status || "");
  const status: Station["status"] =
    statusStr === "online" || statusStr === "charging" ? statusStr : "offline";
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
    .select("id, name, company_id, status, created_at")
    .order("name");
  if (companyId != null) {
    query = query.eq("company_id", companyId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRowToStation);
}

/** Cria uma nova estação */
export async function createStation(input: CreateStationInput): Promise<Station> {
  const insert: Record<string, unknown> = {
    name: input.name,
    company_id: input.company_id,
    city: input.city ?? null,
    uf: input.uf ?? null,
    status: "offline",
  };
  // charge_point_id: incluir quando coluna existir no banco (migration OCPP)
  // if (input.charge_point_id) insert.charge_point_id = input.charge_point_id;

  const { data, error } = await supabase.from("stations").insert(insert).select().single();
  if (error) throw error;
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

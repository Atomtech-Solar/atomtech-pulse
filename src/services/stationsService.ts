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
  connector_count?: number | null;
  // Geral (1/4)
  website_url?: string | null;
  description?: string | null;
  external_id?: string | null;
  station_type?: string | null;
  station_group?: string | null;
  enable_reservation?: boolean;
  enabled?: boolean;
  show_charge_percentage?: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  open_24h?: boolean;
  // Endereço (2/4)
  cep?: string | null;
  street?: string | null;
  address_number?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  show_location?: boolean;
  // Pagamento (3/4)
  charge_enabled?: boolean;
  charge_type?: "kwh" | "min" | null;
  cost_per_kwh?: number | null;
  revenue_charge_type?: "estação" | "conector" | string | null;
  revenue_per_start?: number | null;
  revenue_tax_percent?: number | null;
  revenue_per_kwh?: number | null;
  // Fotos (4/4)
  main_photo_url?: string | null;
  photo_urls?: string[] | null;
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

  const stationIds = stations.map((s) => Number(s.id));
  let connectorsData: unknown[] = [];
  if (stationIds.length > 0) {
    const { data: cd } = await supabase
      .from("connectors")
      .select("station_id, connector_id, status, energy_kwh, power_kw, current_transaction_id")
      .in("station_id", stationIds)
      .order("connector_id");
    connectorsData = cd ?? [];
  }

  const connectorsByStation = new Map<number, Station["connectors"]>();
  for (const c of connectorsData as Array<Record<string, unknown>>) {
    const sid = Number(c.station_id);
    const list = connectorsByStation.get(sid) ?? [];
    list.push({
      connector_id: Number(c.connector_id),
      status: String(c.status ?? "available"),
      energy_kwh: Number(c.energy_kwh) ?? 0,
      power_kw: Number(c.power_kw) ?? 0,
      current_transaction_id: c.current_transaction_id as number | null | undefined,
    });
    connectorsByStation.set(sid, list);
  }

  stations.forEach((s) => {
    s.connectors = connectorsByStation.get(Number(s.id)) ?? [];
  });

  // Ordenar: online/charging primeiro, depois offline
  stations.sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 99;
    const orderB = STATUS_ORDER[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return stations;
}

/** Detalhes da estação para página de monitoramento */
export interface StationDetails {
  station_id: string;
  charge_point_id: string;
  name: string;
  vendor: string | null;
  model: string | null;
  firmware: string | null;
  status: string;
  last_seen: string | null;
  total_sessions: number;
  total_kwh: number;
  connector_count: number | null;
  connectors: Array<{
    connector_id: number;
    status: string;
    energy_kwh: number;
    power_kw: number;
    current_transaction_id: number | null;
  }>;
  recent_sessions: Array<{
    transaction_id: string | number;
    connector_id: number;
    start_time: string;
    stop_time: string | null;
    energy_kwh: number;
  }>;
  // Geral
  website_url: string | null;
  description: string | null;
  external_id: string | null;
  station_type: string | null;
  station_group: string | null;
  enable_reservation: boolean;
  enabled: boolean;
  show_charge_percentage: boolean;
  opening_time: string | null;
  closing_time: string | null;
  open_24h: boolean;
  // Endereço
  city: string | null;
  uf: string | null;
  cep: string | null;
  street: string | null;
  address_number: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  show_location: boolean;
  // Pagamento
  charge_enabled: boolean;
  charge_type: string | null;
  cost_per_kwh: number | null;
  revenue_charge_type: string | null;
  revenue_per_start: number | null;
  revenue_tax_percent: number | null;
  revenue_per_kwh: number | null;
  // Fotos
  main_photo_url: string | null;
  photo_urls: string[] | null;
}

/**
 * Busca detalhes completos de uma estação (estações + conectores + sessões recentes).
 */
export async function getStationDetails(stationId: string): Promise<StationDetails | null> {
  const id = Number(stationId);
  if (Number.isNaN(id)) return null;

  const { data: stationRow, error: stationError } = await supabase
    .from("stations")
    .select(`
      id, name, charge_point_id, status, last_seen, charge_point_vendor, charge_point_model,
      total_kwh, total_sessions, connector_count,
      website_url, description, external_id, station_type, station_group,
      enable_reservation, enabled, show_charge_percentage, opening_time, closing_time, open_24h,
      city, uf, cep, street, address_number, country, lat, lng, show_location,
      charge_enabled, charge_type, cost_per_kwh, revenue_charge_type, revenue_per_start,
      revenue_tax_percent, revenue_per_kwh,
      main_photo_url, photo_urls
    `)
    .eq("id", id)
    .single();

  if (stationError || !stationRow) return null;

  const row = stationRow as Record<string, unknown>;

  const { data: connectorsData } = await supabase
    .from("connectors")
    .select("connector_id, status, energy_kwh, power_kw, current_transaction_id")
    .eq("station_id", id)
    .order("connector_id");

  const connectors = ((connectorsData ?? []) as Array<Record<string, unknown>>).map((c) => ({
    connector_id: Number(c.connector_id),
    status: String(c.status ?? "available"),
    energy_kwh: Number(c.energy_kwh) ?? 0,
    power_kw: Number(c.power_kw) ?? 0,
    current_transaction_id: c.current_transaction_id as number | null,
  }));

  const { data: txData } = await supabase
    .from("transactions")
    .select("ocpp_transaction_id, start_time, end_time, energy_kwh, connector_id")
    .eq("station_id", id)
    .order("start_time", { ascending: false })
    .limit(10);

  const recent_sessions = ((txData ?? []) as Array<Record<string, unknown>>).map((row) => ({
    transaction_id: (row.ocpp_transaction_id ?? row.id) as string | number,
    connector_id: Number(row.connector_id),
    start_time: String(row.start_time ?? ""),
    stop_time: row.end_time ? String(row.end_time) : null,
    energy_kwh: Number(row.energy_kwh) ?? 0,
  }));

  const fmtTime = (v: unknown) => (v != null ? String(v).slice(0, 5) : null);

  return {
    station_id: String(row.id),
    charge_point_id: String(row.charge_point_id ?? ""),
    name: String(row.name ?? ""),
    vendor: row.charge_point_vendor ? String(row.charge_point_vendor) : null,
    model: row.charge_point_model ? String(row.charge_point_model) : null,
    firmware: null,
    status: String(row.status ?? "offline"),
    last_seen: row.last_seen ? String(row.last_seen) : null,
    total_sessions: Number(row.total_sessions) ?? 0,
    total_kwh: Number(row.total_kwh) ?? 0,
    connector_count: row.connector_count != null ? Number(row.connector_count) : null,
    connectors,
    recent_sessions,
    website_url: row.website_url ? String(row.website_url) : null,
    description: row.description ? String(row.description) : null,
    external_id: row.external_id ? String(row.external_id) : null,
    station_type: row.station_type ? String(row.station_type) : null,
    station_group: row.station_group ? String(row.station_group) : null,
    enable_reservation: Boolean(row.enable_reservation),
    enabled: row.enabled !== false,
    show_charge_percentage: Boolean(row.show_charge_percentage),
    opening_time: fmtTime(row.opening_time),
    closing_time: fmtTime(row.closing_time),
    open_24h: row.open_24h !== false,
    city: row.city ? String(row.city) : null,
    uf: row.uf ? String(row.uf) : null,
    cep: row.cep ? String(row.cep) : null,
    street: row.street ? String(row.street) : null,
    address_number: row.address_number ? String(row.address_number) : null,
    country: row.country ? String(row.country) : null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    show_location: row.show_location !== false,
    charge_enabled: Boolean(row.charge_enabled),
    charge_type: row.charge_type ? String(row.charge_type) : null,
    cost_per_kwh: row.cost_per_kwh != null ? Number(row.cost_per_kwh) : null,
    revenue_charge_type: row.revenue_charge_type ? String(row.revenue_charge_type) : null,
    revenue_per_start: row.revenue_per_start != null ? Number(row.revenue_per_start) : null,
    revenue_tax_percent: row.revenue_tax_percent != null ? Number(row.revenue_tax_percent) : null,
    revenue_per_kwh: row.revenue_per_kwh != null ? Number(row.revenue_per_kwh) : null,
    main_photo_url: row.main_photo_url ? String(row.main_photo_url) : null,
    photo_urls: Array.isArray(row.photo_urls) ? (row.photo_urls as string[]) : null,
  };
}

/**
 * Retorna consumo diário (kWh) dos últimos 28 dias para gráficos.
 * Agrega transações por dia.
 */
export async function getStationConsumptionByDay(
  stationId: string,
): Promise<Array<{ date: string; day: string; kwh: number }>> {
  const id = Number(stationId);
  if (Number.isNaN(id)) return [];

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 28);

  const { data } = await supabase
    .from("transactions")
    .select("start_time, energy_kwh")
    .eq("station_id", id)
    .gte("start_time", daysAgo.toISOString())
    .not("energy_kwh", "is", null);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }

  for (const row of (data ?? []) as Array<{ start_time: string; energy_kwh: number }>) {
    const key = row.start_time?.slice(0, 10);
    if (key && byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + (Number(row.energy_kwh) || 0));
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, kwh]) => ({
      date,
      day: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      kwh: Math.round(kwh * 100) / 100,
    }));
}

/**
 * Atualiza o campo enabled de uma estação.
 */
export async function updateStationEnabled(
  stationId: string,
  enabled: boolean,
): Promise<void> {
  const id = Number(stationId);
  if (Number.isNaN(id)) throw new Error("ID inválido");
  const { error } = await supabase
    .from("stations")
    .update({ enabled })
    .eq("id", id);
  if (error) throw error;
}

const PG_UNIQUE_VIOLATION = "23505";
const PG_UNDEFINED_COLUMN = "42703";
const SESSION_REFRESH_TIMEOUT_MS = 10000;

/** Remove undefined do objeto (Supabase/PostgREST pode falhar com undefined). */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

/** Cria estação. Status sempre 'offline' (atualizado automaticamente pelo OCPP). */
export async function createStation(input: CreateStationInput): Promise<Station> {
  const sanitized = sanitizeChargePointId(input.charge_point_id.trim());
  if (!sanitized.valid) throw new Error(sanitized.error);

  // Não chamar getUser() — pode travar (Supabase auth server). O client já anexa o token no insert.

  const insert: Record<string, unknown> = {
    name: input.name.trim(),
    charge_point_id: sanitized.id,
    company_id: input.company_id,
    city: input.city?.trim() || null,
    uf: input.uf?.trim().toUpperCase().slice(0, 2) || null,
    charge_point_vendor: input.charge_point_vendor?.trim().slice(0, 50) || null,
    charge_point_model: input.charge_point_model?.trim().slice(0, 50) || null,
    status: "offline",
    website_url: input.website_url?.trim() || null,
    description: input.description?.trim() || null,
    external_id: input.external_id?.trim() || null,
    station_type: input.station_type?.trim() || null,
    station_group: input.station_group?.trim() || null,
    enable_reservation: input.enable_reservation ?? false,
    enabled: input.enabled ?? true,
    show_charge_percentage: input.show_charge_percentage ?? false,
    opening_time: input.opening_time?.trim() || null,
    closing_time: input.closing_time?.trim() || null,
    open_24h: input.open_24h ?? true,
    cep: input.cep?.trim() || null,
    street: input.street?.trim() || null,
    address_number: input.address_number?.trim() || null,
    country: input.country?.trim() || null,
    lat: input.lat != null ? Number(input.lat) : null,
    lng: input.lng != null ? Number(input.lng) : null,
    show_location: input.show_location ?? true,
    charge_enabled: input.charge_enabled ?? false,
    charge_type: input.charge_type || null,
    cost_per_kwh: input.cost_per_kwh != null ? Number(input.cost_per_kwh) : null,
    revenue_charge_type: input.revenue_charge_type?.trim() || null,
    revenue_per_start: input.revenue_per_start != null ? Number(input.revenue_per_start) : null,
    revenue_tax_percent: input.revenue_tax_percent != null ? Number(input.revenue_tax_percent) : null,
    revenue_per_kwh: input.revenue_per_kwh != null ? Number(input.revenue_per_kwh) : null,
    main_photo_url: input.main_photo_url?.trim() || null,
    photo_urls: input.photo_urls?.length ? input.photo_urls : null,
  };
  // connector_count só é enviado se a migration 20260319 foi aplicada (coluna existe)
  if (input.connector_count != null && input.connector_count > 0) {
    insert.connector_count = input.connector_count;
  }

  const cleanInsert = stripUndefined(insert);
  console.log("[stationsService] Insert payload (limpo):", JSON.stringify(cleanInsert, null, 2));

  // Payload mínimo (apenas colunas base - fallback se extended columns não existirem)
  const coreInsert: Record<string, unknown> = {
    name: input.name.trim(),
    charge_point_id: sanitized.id,
    company_id: input.company_id,
    status: "offline",
  };

  // 1) INSERT sem .select() - evita hang no RETURNING (RLS no SELECT da linha nova pode travar)
  let insertError: { code?: string; message?: string } | null = null;
  try {
    console.log("[stationsService] Chamando INSERT (sem RETURNING)...");
    const result = await supabase.from("stations").insert(cleanInsert);
    insertError = result.error;
    if (insertError) {
      const err = insertError as { code?: string };
      const msg = String(insertError.message ?? "");
      const isColMissing = err.code === PG_UNDEFINED_COLUMN || msg.includes("does not exist") || msg.includes("Could not find") || msg.includes("schema cache");
      if (isColMissing) {
        // Tenta sem connector_count (migration 20260319 pode não estar aplicada)
        const withoutConnector = { ...cleanInsert };
        delete (withoutConnector as Record<string, unknown>).connector_count;
        console.warn("[stationsService] Coluna inexistente, tentando sem connector_count...");
        const retry = await supabase.from("stations").insert(withoutConnector);
        insertError = retry.error;
        if (!insertError) console.log("[stationsService] Insert sem connector_count OK");
      }
      if (insertError && isColMissing) {
        // Fallback: insert mínimo
        console.warn("[stationsService] Tentando insert mínimo...");
        const retry2 = await supabase.from("stations").insert(coreInsert);
        insertError = retry2.error;
        if (!insertError) console.log("[stationsService] Insert mínimo OK");
      }
    }
    console.log("[stationsService] INSERT retornou, error:", insertError?.message ?? "null");
    if (insertError) {
      const err = insertError as { code?: string; message?: string };
      if (err.code === PG_UNIQUE_VIOLATION) {
        throw new Error("Charge Point ID já cadastrado. Use um valor único.");
      }
      if (err.code === PG_UNDEFINED_COLUMN || insertError.message?.includes("does not exist")) {
        throw new Error(`Coluna inexistente. Execute: pnpm db:push — ${insertError.message ?? ""}`);
      }
      throw new Error(insertError.message ?? "Erro ao criar estação");
    }
  } catch (e) {
    console.error("[stationsService] Insert exception:", e);
    throw e;
  }

  // 2) Busca a estação criada (SELECT separado - mais estável que RETURNING)
  const { data, error } = await supabase
    .from("stations")
    .select("*")
    .eq("charge_point_id", sanitized.id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[stationsService] Select após insert error:", error);
    throw new Error(error.message ?? "Estação criada mas falha ao buscar dados.");
  }

  if (!data) {
    throw new Error("Estação criada mas não encontrada (possível bloqueio RLS no SELECT).");
  }

  console.log("[stationsService] Insert success, station:", data);
  return mapRowToStation(data as Record<string, unknown>);
}

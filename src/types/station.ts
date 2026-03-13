/** Status possíveis da estação OCPP (atualizado automaticamente pelo backend) */
export type StationStatus = "offline" | "online" | "charging" | "faulted" | "unavailable";

/** Estação de carregamento OCPP - estrutura da tabela stations no Supabase */
export interface Station {
  id: string;
  name: string;
  charge_point_id: string;
  company_id: string;
  status: StationStatus;
  last_seen: string | null;
  charge_point_vendor: string | null;
  charge_point_model: string | null;
  city: string | null;
  uf: string | null;
  total_kwh: number;
  total_sessions: number;
  created_at: string;
}

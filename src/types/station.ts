/** Status possíveis da estação OCPP (atualizado automaticamente pelo backend) */
export type StationStatus = "offline" | "online" | "charging" | "faulted" | "unavailable";

/** Conector (boca) de carregamento OCPP */
export interface Connector {
  connector_id: number;
  status: string;
  energy_kwh: number;
  power_kw: number;
  current_transaction_id?: number | null;
}

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
  connectors?: Connector[];
}

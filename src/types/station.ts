/** Conexão com o charge point (WebSocket); não confundir com estado da boca */
export type StationStatus = "offline" | "online" | "error";

/** Estado operacional da boca (agregado OCPP) */
export type ConnectorOperationalStatus =
  | "available"
  | "charging"
  | "unavailable"
  | "error";

/** WS = IP/host + porta típica; WSS = domínio com TLS */
export type StationConnectionType = "ws" | "wss";

/** Conector (boca) de carregamento OCPP */
export interface Connector {
  connector_id: number;
  status: ConnectorOperationalStatus | string;
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
  connection_type?: StationConnectionType;
  ocpp_host?: string | null;
  ocpp_port?: number | null;
  last_error?: string | null;
  city: string | null;
  uf: string | null;
  total_kwh: number;
  total_sessions: number;
  created_at: string;
  connectors?: Connector[];
}

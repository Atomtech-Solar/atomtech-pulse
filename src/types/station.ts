/** Status possíveis da estação OCPP (só alterado por eventos OCPP) */
export type StationStatus = "offline" | "online" | "charging" | "faulted" | "unavailable";

/** Estação de carregamento OCPP */
export interface Station {
  id: string;
  name: string;
  charge_point_id: string;
  company_id: string;
  status: StationStatus;
  created_at: string;
}

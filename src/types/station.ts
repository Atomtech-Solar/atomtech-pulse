/** Estação de carregamento OCPP */
export interface Station {
  id: string;
  name: string;
  charge_point_id: string;
  company_id: string;
  status: "offline" | "online" | "charging";
  created_at: string;
}

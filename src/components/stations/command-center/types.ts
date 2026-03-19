/** Evento da timeline operacional (derivado de sessões ou logs OCPP) */
export interface StationEvent {
  id: string;
  type: "started" | "stopped" | "error" | "status_change";
  label: string;
  timestamp: string;
  isSuccess: boolean;
  connectorId?: number;
  transactionId?: string | number;
}

/** Transação formatada para exibição */
export interface StationTransaction {
  id: string | number;
  energyKwh: number;
  durationMinutes: number;
  valueBrl: number | null;
  startTime: string;
  stopTime: string | null;
  connectorId: number;
  status: "active" | "completed";
}

/** Dado diário para gráfico de consumo */
export interface DailyConsumption {
  date: string;
  day: string;
  kwh: number;
}

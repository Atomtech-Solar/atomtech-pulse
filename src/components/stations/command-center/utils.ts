import type { StationDetails } from "@/services/stationsService";
import type { StationEvent, StationTransaction } from "./types";

/**
 * Deriva eventos da timeline a partir das sessões recentes.
 * Suporta futura integração com WebSocket e logs OCPP.
 */
export function deriveEventsFromSessions(
  sessions: StationDetails["recent_sessions"],
): StationEvent[] {
  const events: StationEvent[] = [];
  for (const s of sessions) {
    if (s.start_time) {
      events.push({
        id: `start-${s.transaction_id}`,
        type: "started",
        label: `Sessão iniciada • Connector ${s.connector_id}`,
        timestamp: s.start_time,
        isSuccess: true,
        connectorId: s.connector_id,
        transactionId: s.transaction_id,
      });
    }
    if (s.stop_time) {
      events.push({
        id: `stop-${s.transaction_id}`,
        type: "stopped",
        label: `Sessão finalizada • ${s.energy_kwh.toFixed(2)} kWh`,
        timestamp: s.stop_time,
        isSuccess: true,
        connectorId: s.connector_id,
        transactionId: s.transaction_id,
      });
    }
  }
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events.slice(0, 20);
}

/**
 * Converte sessões em transações formatadas para exibição.
 */
export function sessionsToTransactions(
  sessions: StationDetails["recent_sessions"],
  costPerKwh: number | null,
): StationTransaction[] {
  return sessions.map((s) => {
    const start = s.start_time ? new Date(s.start_time).getTime() : 0;
    const end = s.stop_time ? new Date(s.stop_time).getTime() : Date.now();
    const durationMinutes = (end - start) / (1000 * 60);
    const valueBrl =
      costPerKwh != null && costPerKwh > 0
        ? s.energy_kwh * costPerKwh
        : null;

    return {
      id: s.transaction_id,
      energyKwh: s.energy_kwh,
      durationMinutes: Math.max(0, durationMinutes),
      valueBrl,
      startTime: s.start_time,
      stopTime: s.stop_time,
      connectorId: s.connector_id,
      status: s.stop_time ? "completed" : "active",
    };
  });
}

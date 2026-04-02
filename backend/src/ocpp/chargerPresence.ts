import type { WebSocket } from "ws";
import { updateStationLastSeen } from "../services/stationService";

/** Conexões OCPP ativas (charge_point_id → socket + última atividade) */
const connections = new Map<string, { ws: WebSocket; lastActivity: number }>();

const lastSeenDbAt = new Map<string, number>();
const THROTTLE_LAST_SEEN_MS = 5000;

export function registerConnection(chargePointId: string, ws: WebSocket): void {
  connections.set(chargePointId, { ws, lastActivity: Date.now() });
}

export function unregisterConnection(chargePointId: string): void {
  connections.delete(chargePointId);
  lastSeenDbAt.delete(chargePointId);
}

/** Atualiza atividade (mensagem OCPP ou pong) e last_seen no banco com throttle */
export function touchPresence(chargePointId: string): void {
  const c = connections.get(chargePointId);
  if (c) c.lastActivity = Date.now();

  const now = Date.now();
  const last = lastSeenDbAt.get(chargePointId) ?? 0;
  if (now - last < THROTTLE_LAST_SEEN_MS) return;
  lastSeenDbAt.set(chargePointId, now);
  void updateStationLastSeen(chargePointId).catch((err) =>
    console.warn(`[chargerPresence] last_seen (${chargePointId}):`, err)
  );
}

export function isChargePointConnected(chargePointId: string): boolean {
  return connections.has(chargePointId);
}

/**
 * Encerra sockets sem atividade recente (TCP “zumbi”). O evento `close` do WS
 * dispara update offline no ocppServer.
 */
export function terminateStaleConnections(staleMs: number): void {
  const now = Date.now();
  for (const [cpId, { ws, lastActivity }] of connections) {
    if (now - lastActivity > staleMs && ws.readyState === 1) {
      try {
        ws.terminate();
      } catch {
        /* ignore */
      }
    }
  }
}

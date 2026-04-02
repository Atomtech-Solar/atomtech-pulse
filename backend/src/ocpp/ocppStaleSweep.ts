import { terminateStaleConnections } from "./chargerPresence";
import { markIdleStationsOffline, type RealtimeEmitFn } from "../services/stationService";

const IDLE_STATION_SECONDS = Number(process.env.OCPP_IDLE_STATION_SECONDS ?? 60);
const CONNECTION_STALE_MS = Number(process.env.OCPP_CONNECTION_STALE_MS ?? 60_000);
const SWEEP_INTERVAL_MS = Number(process.env.OCPP_STALE_SWEEP_INTERVAL_MS ?? 30_000);

/**
 * A cada intervalo: encerra sockets sem atividade e marca offline no banco
 * estações com last_seen expirado (ex.: após restart do processo).
 */
export function startOcppStaleSweep(emit: RealtimeEmitFn): () => void {
  const tick = () => {
    terminateStaleConnections(CONNECTION_STALE_MS);
    void markIdleStationsOffline(IDLE_STATION_SECONDS, emit);
  };
  const id = setInterval(tick, SWEEP_INTERVAL_MS);
  if (typeof (id as { unref?: () => void }).unref === "function") {
    (id as { unref: () => void }).unref();
  }
  return () => clearInterval(id);
}

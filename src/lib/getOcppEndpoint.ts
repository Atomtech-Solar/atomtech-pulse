/**
 * URL OCPP 1.6J para configurar o carregador (alinha-se ao backend `getOcppEndpoint`).
 */

export type OcppConnectionType = "ws" | "wss";

export interface OcppEndpointCharger {
  charge_point_id: string;
  connection_type: OcppConnectionType;
  ocpp_host?: string | null;
  ocpp_port?: number | null;
}

export interface OcppEndpointEnv {
  defaultWssHost?: string;
  defaultWsHost?: string;
  defaultWsPort?: number;
}

const defaultWss =
  (import.meta.env.VITE_OCPP_DEFAULT_WSS_HOST as string | undefined)?.trim() ||
  "renewed-exploration-production.up.railway.app";
const defaultWs =
  (import.meta.env.VITE_OCPP_DEFAULT_WS_HOST as string | undefined)?.trim() || "104.236.220.195";
const defaultWsPort = Number(import.meta.env.VITE_OCPP_DEFAULT_WS_PORT ?? 8080) || 8080;

export function getOcppEndpoint(charger: OcppEndpointCharger, env?: OcppEndpointEnv): string {
  const protocol = charger.connection_type === "wss" ? "wss" : "ws";
  const defaultHost = protocol === "wss" ? (env?.defaultWssHost ?? defaultWss) : (env?.defaultWsHost ?? defaultWs);
  const host = (charger.ocpp_host?.trim() || defaultHost).replace(/\/$/, "");
  const path = `/ocpp/${encodeURIComponent(charger.charge_point_id)}`;

  let port = charger.ocpp_port;
  if (port == null || Number.isNaN(port)) {
    port = protocol === "ws" ? (env?.defaultWsPort ?? defaultWsPort) : undefined;
  }

  if (protocol === "wss") {
    if (port == null || port === 443) {
      return `wss://${host}${path}`;
    }
    return `wss://${host}:${port}${path}`;
  }

  if (port == null || port === 80) {
    return `ws://${host}${path}`;
  }
  return `ws://${host}:${port}${path}`;
}

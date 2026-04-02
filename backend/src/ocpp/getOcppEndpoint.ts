/**
 * Monta a URL OCPP 1.6J para o carregador (WS ou WSS).
 * Dados vêm da estação (tabela stations): connection_type, ocpp_host, ocpp_port, charge_point_id.
 */

export type OcppConnectionType = "ws" | "wss";

export interface OcppEndpointCharger {
  charge_point_id: string;
  connection_type: OcppConnectionType;
  ocpp_host?: string | null;
  ocpp_port?: number | null;
}

export interface OcppEndpointEnv {
  /** Host padrão quando ocpp_host está vazio (WSS — ex.: ocpp.dominio.com) */
  defaultWssHost?: string;
  /** Host padrão quando ocpp_host está vazio (WS — ex.: IP ou hostname local) */
  defaultWsHost?: string;
  /** Porta padrão para WS quando não informada (ex.: 8080) */
  defaultWsPort?: number;
}

const DEFAULT_WSS_HOST = (
  process.env.OCPP_DEFAULT_WSS_HOST ?? "renewed-exploration-production.up.railway.app"
).trim() || "renewed-exploration-production.up.railway.app";
const DEFAULT_WS_HOST = (process.env.OCPP_DEFAULT_WS_HOST ?? "104.236.220.195").trim() || "104.236.220.195";
const DEFAULT_WS_PORT = Number(process.env.OCPP_DEFAULT_WS_PORT ?? process.env.PORT ?? 8080) || 8080;

/**
 * Retorna URL completa do endpoint OCPP para exibição/configuração do carregador.
 */
export function getOcppEndpoint(charger: OcppEndpointCharger, env?: OcppEndpointEnv): string {
  const protocol = charger.connection_type === "wss" ? "wss" : "ws";
  const defaultHost =
    protocol === "wss"
      ? (env?.defaultWssHost ?? DEFAULT_WSS_HOST)
      : (env?.defaultWsHost ?? DEFAULT_WS_HOST);
  const host = (charger.ocpp_host?.trim() || defaultHost).replace(/\/$/, "");
  const path = `/ocpp/${encodeURIComponent(charger.charge_point_id)}`;

  let port = charger.ocpp_port;
  if (port == null || Number.isNaN(port)) {
    port = protocol === "ws" ? (env?.defaultWsPort ?? DEFAULT_WS_PORT) : undefined;
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

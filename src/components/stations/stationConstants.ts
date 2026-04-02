/** Status da estação = conexão OCPP (WebSocket), não estado da boca */
export const stationStatusColors: Record<string, string> = {
  online:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  offline: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  error: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/35",
};

export const stationStatusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  error: "Erro",
};

/** Status da boca (conector): available | charging | unavailable | error */
export const connectorStatusColors: Record<string, string> = {
  available:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  charging:
    "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  unavailable:
    "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  error: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/35",
};

export const connectorStatusLabels: Record<string, string> = {
  available: "Disponível",
  charging: "Carregando",
  unavailable: "Indisponível",
  error: "Erro",
};

/** @deprecated — legado para telas que ainda misturavam estação; use stationStatusColors */
export const statusColors: Record<string, string> = {
  ...stationStatusColors,
  ...connectorStatusColors,
};

/** @deprecated — use stationStatusLabels ou connectorStatusLabels */
export const statusLabels: Record<string, string> = {
  ...stationStatusLabels,
  ...connectorStatusLabels,
};

export function formatLastSeen(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plug, Zap } from "lucide-react";
import { statusColors, formatDateTime } from "./stationConstants";

interface ConnectorCardProps {
  connectorId: number;
  status: string;
  powerKw: number;
  energyKwh: number;
  hasActiveSession: boolean;
  lastActivity?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  charging: "Carregando",
  available: "Disponível",
  unavailable: "Indisponível",
  faulted: "Falha",
  offline: "Offline",
};

export default function ConnectorCard({
  connectorId,
  status,
  powerKw,
  energyKwh,
  hasActiveSession,
  lastActivity,
}: ConnectorCardProps) {
  const badgeClass =
    status === "charging"
      ? statusColors.charging
      : status === "available"
        ? statusColors.available
        : statusColors[status] ?? "bg-muted";

  return (
    <Card className="transition-colors hover:border-muted-foreground/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-muted/50 p-2">
              <Plug className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Conector {connectorId}</p>
              <p className="text-xs text-muted-foreground">
                {powerKw > 0 ? `${powerKw} kW` : "Potência não informada"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 ${badgeClass}`}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{energyKwh > 0 ? `${energyKwh.toFixed(1)} kWh` : "0 kWh"}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Última atividade</p>
            <p className="text-xs font-medium">
              {lastActivity ? formatDateTime(lastActivity) : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

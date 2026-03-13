import { Badge } from "@/components/ui/badge";
import { statusColors } from "./stationConstants";

interface ConnectorCardProps {
  connectorId: number;
  status: string;
  powerKw: number;
  energyKwh: number;
  hasActiveSession: boolean;
}

export default function ConnectorCard({
  connectorId,
  status,
  powerKw,
  energyKwh,
  hasActiveSession,
}: ConnectorCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">Connector {connectorId}</span>
        <Badge
          variant="outline"
          className={
            status === "charging"
              ? statusColors.charging
              : status === "available"
                ? statusColors.available
                : statusColors[status] ?? "bg-muted"
          }
        >
          {status}
        </Badge>
      </div>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Potência: </span>
          {powerKw > 0 ? `${powerKw} kW` : "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Energia: </span>
          {energyKwh > 0 ? `${energyKwh.toFixed(2)} kWh` : "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Sessão ativa: </span>
          {hasActiveSession ? "Sim" : "Não"}
        </p>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  connectorStatusColors,
  connectorStatusLabels,
} from "@/components/stations/stationConstants";

interface ConnectorInfo {
  connector_id: number;
  status: string;
  energy_kwh?: number;
}

interface StationConnectorsProps {
  connectorCount: number | null;
  connectors: ConnectorInfo[];
}

function normalizeConnectorBadge(status: string): string {
  const k = status.toLowerCase();
  return connectorStatusColors[k] ?? "bg-muted/80 text-foreground border-border";
}

function connectorLabel(status: string): string {
  const k = status.toLowerCase();
  return connectorStatusLabels[k] ?? status;
}

export default function StationConnectors({
  connectorCount,
  connectors,
}: StationConnectorsProps) {
  const count = connectors.length > 0 ? connectors.length : connectorCount ?? 0;

  if (count === 0) {
    return null;
  }

  const hasRows = connectors.length > 0;
  const items: ConnectorInfo[] = hasRows
    ? connectors
    : Array.from({ length: count }, (_, i) => ({
        connector_id: i + 1,
        status: "unknown",
        energy_kwh: undefined,
      }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="transition-colors hover:border-muted-foreground/20">
        <CardHeader className="pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conectores (bocas)
          </h4>
        </CardHeader>
        <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
          {items.map((c, i) => {
            const energy =
              c.energy_kwh != null && !Number.isNaN(Number(c.energy_kwh))
                ? Number(c.energy_kwh)
                : null;
            const label = connectorLabel(hasRows ? c.status : "unknown");
            return (
              <motion.div
                key={c.connector_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.04 }}
                className="flex flex-col rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
              >
                <p className="text-sm font-semibold leading-tight">
                  Boca {c.connector_id}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 shrink-0 text-primary/80" />
                  <span>
                    {energy != null && energy > 0
                      ? `${energy.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })} kWh`
                      : hasRows
                        ? "0 kWh"
                        : "—"}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-2 w-fit text-xs font-medium",
                    hasRows ? normalizeConnectorBadge(c.status) : "bg-muted/80 text-foreground border-border",
                  )}
                >
                  {hasRows ? label : "Aguardando dados"}
                </Badge>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

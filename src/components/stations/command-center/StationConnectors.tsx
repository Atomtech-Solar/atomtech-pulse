import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ConnectorInfo {
  connector_id: number;
  status: string;
}

interface StationConnectorsProps {
  connectorCount: number | null;
  connectors: ConnectorInfo[];
}

const STATUS_COLORS: Record<string, string> = {
  available: "text-emerald-500",
  charging: "text-blue-500",
  online: "text-emerald-500",
  offline: "text-muted-foreground",
  faulted: "text-destructive",
  unavailable: "text-amber-500",
};

export default function StationConnectors({
  connectorCount,
  connectors,
}: StationConnectorsProps) {
  const count = connectors.length > 0 ? connectors.length : connectorCount ?? 0;

  if (count === 0) {
    return null;
  }

  const items = connectors.length > 0
    ? connectors
    : Array.from({ length: count }, (_, i) => ({
        connector_id: i + 1,
        status: "unknown" as string,
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
            Conectores
          </h4>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {items.map((c, i) => {
            const colorClass =
              connectors.length > 0
                ? STATUS_COLORS[c.status] ?? "text-muted-foreground"
                : "text-muted-foreground";
            return (
              <motion.div
                key={c.connector_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center justify-center rounded-lg border bg-muted/30 p-2"
                title={
                  connectors.length > 0
                    ? `Connector ${c.connector_id} • ${c.status}`
                    : `Connector ${c.connector_id}`
                }
              >
                <Zap className={`h-5 w-5 ${colorClass}`} />
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

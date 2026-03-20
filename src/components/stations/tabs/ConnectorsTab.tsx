import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Plug } from "lucide-react";
import { motion } from "framer-motion";
import ConnectorCard from "../ConnectorCard";
import type { StationDetails } from "@/services/stationsService";

interface ConnectorsTabProps {
  station: StationDetails;
  onAddConnector?: () => void;
}

function getLastActivityForConnector(
  connectorId: number,
  recentSessions: StationDetails["recent_sessions"],
): string | null {
  const session = recentSessions.find((s) => s.connector_id === connectorId);
  return session?.start_time ?? null;
}

export default function ConnectorsTab({
  station,
  onAddConnector,
}: ConnectorsTabProps) {
  const hasConnectors = station.connectors.length > 0;

  if (!hasConnectors) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <Plug className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhum conector cadastrado</h3>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              Adicione conectores para monitorar as bocas de carregamento desta
              estação.
            </p>
            {onAddConnector && (
              <Button className="mt-6" onClick={onAddConnector}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar conector
              </Button>
            )}
            {!onAddConnector && (
              <Button className="mt-6" variant="outline" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar conector
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {station.connectors.map((conn, index) => (
        <motion.div
          key={conn.connector_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
        >
          <ConnectorCard
            connectorId={conn.connector_id}
            status={conn.status}
            powerKw={conn.power_kw}
            energyKwh={conn.energy_kwh}
            hasActiveSession={!!conn.current_transaction_id}
            lastActivity={getLastActivityForConnector(
              conn.connector_id,
              station.recent_sessions,
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getStationDetails } from "@/services/stationsService";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StationHeader from "@/components/stations/StationHeader";
import ConnectorCard from "@/components/stations/ConnectorCard";
import SessionTable from "@/components/stations/SessionTable";
import {
  statusColors,
  statusLabels,
  formatLastSeen,
} from "@/components/stations/stationConstants";

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className={mono ? "font-mono text-sm" : "text-sm"}>{value}</div>
    </div>
  );
}

export default function StationDetailsPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isSessionReady } = useAuth();

  const { data: station, isLoading, error } = useQuery({
    queryKey: ["station-details", stationId],
    queryFn: () => getStationDetails(stationId!),
    enabled: isSessionReady && !!user && !!stationId,
  });

  useEffect(() => {
    if (!stationId) return;

    const channelStations = supabase
      .channel(`station-details-station-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stations",
          filter: `id=eq.${stationId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["station-details", stationId],
          });
        }
      )
      .subscribe();

    const channelConnectors = supabase
      .channel(`station-details-connectors-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connectors",
          filter: `station_id=eq.${stationId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["station-details", stationId],
          });
        }
      )
      .subscribe();

    const channelTransactions = supabase
      .channel(`station-details-transactions-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `station_id=eq.${stationId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["station-details", stationId],
          });
        }
      )
      .subscribe();

    return () => {
      channelStations.unsubscribe();
      channelConnectors.unsubscribe();
      channelTransactions.unsubscribe();
    };
  }, [stationId, queryClient]);

  const handleBack = () => navigate("/dashboard/stations");

  if (!stationId) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={handleBack}>
          Voltar para estações
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            ID da estação não informado.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={handleBack}>
          Voltar para estações
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando detalhes da estação...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={handleBack}>
          Voltar para estações
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Estação não encontrada ou erro ao carregar.
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionRows = station.recent_sessions.map((s) => ({
    transactionId: s.transaction_id,
    connectorId: s.connector_id,
    startTime: s.start_time,
    stopTime: s.stop_time,
    energyKwh: s.energy_kwh,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <StationHeader
        name={station.name}
        chargePointId={station.charge_point_id}
      />

      {/* Bloco 1 — Informações da Estação */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Informações da Estação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Charge Point ID" value={station.charge_point_id} mono />
            <DetailItem label="Fabricante" value={station.vendor ?? "—"} />
            <DetailItem label="Modelo" value={station.model ?? "—"} />
            <DetailItem label="Firmware" value={station.firmware ?? "—"} />
            <DetailItem
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={statusColors[station.status] ?? statusColors.offline}
                >
                  {statusLabels[station.status] ?? station.status}
                </Badge>
              }
            />
            <DetailItem
              label="Última comunicação"
              value={formatLastSeen(station.last_seen)}
            />
            <DetailItem label="Total de sessões" value={String(station.total_sessions)} />
            <DetailItem
              label="Energia total fornecida"
              value={`${Number(station.total_kwh).toFixed(2)} kWh`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2 — Conectores */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Conectores</CardTitle>
        </CardHeader>
        <CardContent>
          {station.connectors.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nenhum conector cadastrado para esta estação.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {station.connectors.map((conn) => (
                <ConnectorCard
                  key={conn.connector_id}
                  connectorId={conn.connector_id}
                  status={conn.status}
                  powerKw={conn.power_kw}
                  energyKwh={conn.energy_kwh}
                  hasActiveSession={!!conn.current_transaction_id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloco 3 — Sessões Recentes */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionTable sessions={sessionRows} />
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStationDetails } from "@/services/stationsService";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap } from "lucide-react";

const statusColors: Record<string, string> = {
  offline: "bg-muted text-muted-foreground border-muted",
  online:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  charging:
    "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  faulted: "bg-destructive/20 text-destructive border-destructive/30",
  unavailable:
    "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  available:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const statusLabels: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  charging: "Carregando",
  faulted: "Falha",
  unavailable: "Indisponível",
  available: "Disponível",
};

function formatLastSeen(value: string | null): string {
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

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StationDetailsPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: station, isLoading, error } = useQuery({
    queryKey: ["station-details", stationId],
    queryFn: () => getStationDetails(stationId!),
    enabled: !!stationId,
  });

  useEffect(() => {
    if (!stationId) return;

    const channelStations = supabase
      .channel(`station-details-station-${stationId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stations", filter: `id=eq.${stationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["station-details", stationId] });
        }
      )
      .subscribe();

    const channelConnectors = supabase
      .channel(`station-details-connectors-${stationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connectors", filter: `station_id=eq.${stationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["station-details", stationId] });
        }
      )
      .subscribe();

    const channelTransactions = supabase
      .channel(`station-details-transactions-${stationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `station_id=eq.${stationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["station-details", stationId] });
        }
      )
      .subscribe();

    return () => {
      channelStations.unsubscribe();
      channelConnectors.unsubscribe();
      channelTransactions.unsubscribe();
    };
  }, [stationId, queryClient]);

  if (!stationId) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate("/dashboard/stations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para dashboard
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
        <Button variant="ghost" onClick={() => navigate("/dashboard/stations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para dashboard
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
        <Button variant="ghost" onClick={() => navigate("/dashboard/stations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para dashboard
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Estação não encontrada ou erro ao carregar.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/stations")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            {station.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {station.charge_point_id}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/stations")}>
          Voltar para dashboard
        </Button>
      </div>

      {/* Seção 1 — Informações da Estação */}
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
            <DetailItem label="Última comunicação" value={formatLastSeen(station.last_seen)} />
            <DetailItem label="Total de sessões" value={String(station.total_sessions)} />
            <DetailItem
              label="Energia total fornecida"
              value={`${Number(station.total_kwh).toFixed(2)} kWh`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção 2 — Conectores */}
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
                <div
                  key={conn.connector_id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Connector {conn.connector_id}</span>
                    <Badge
                      variant="outline"
                      className={
                        conn.status === "charging"
                          ? statusColors.charging
                          : conn.status === "available"
                            ? statusColors.available
                            : statusColors[conn.status] ?? "bg-muted"
                      }
                    >
                      {conn.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Potência: </span>
                      {conn.power_kw > 0 ? `${conn.power_kw} kW` : "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Energia: </span>
                      {conn.energy_kwh > 0 ? `${conn.energy_kwh.toFixed(2)} kWh` : "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Sessão ativa: </span>
                      {conn.current_transaction_id ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 3 — Sessões Recentes */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {station.transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nenhuma sessão registrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Início</th>
                    <th className="text-left py-2 font-medium">Fim</th>
                    <th className="text-left py-2 font-medium">Energia</th>
                    <th className="text-left py-2 font-medium">Connector</th>
                  </tr>
                </thead>
                <tbody>
                  {station.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50">
                      <td className="py-2">{formatDateTime(tx.start_time)}</td>
                      <td className="py-2">{formatDateTime(tx.end_time)}</td>
                      <td className="py-2">{tx.energy_kwh.toFixed(2)} kWh</td>
                      <td className="py-2">{tx.connector_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStationDetails,
  getStationConsumptionByDay,
  updateStationEnabled,
  deleteStation,
} from "@/services/stationsService";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  StationHeader,
  StationSidebar,
  StationEvents,
  StationTransactions,
  StationAnalytics,
  StationMetrics,
  StationFinancial,
  StationConnectors,
  StationPhotoBanner,
  StationPhotoGallery,
  deriveEventsFromSessions,
  sessionsToTransactions,
} from "@/components/stations/command-center";
import CommandCenterSkeleton from "@/components/stations/command-center/CommandCenterSkeleton";

function computeTotalRevenue(
  totalKwh: number,
  costPerKwh: number | null,
): number | null {
  if (costPerKwh == null || Number.isNaN(costPerKwh) || costPerKwh <= 0)
    return null;
  const value = totalKwh * costPerKwh;
  return Number.isNaN(value) ? null : value;
}

export default function StationDetailsPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isSessionReady } = useAuth();
  const canDeleteStation =
    user?.role === "super_admin" || user?.role === "company_admin";

  const { data: station, isLoading, error } = useQuery({
    queryKey: ["station-details", stationId],
    queryFn: () => getStationDetails(stationId!),
    enabled: isSessionReady && !!user && !!stationId,
  });

  const { data: dailyConsumption = [], isLoading: consumptionLoading } = useQuery({
    queryKey: ["station-consumption", stationId],
    queryFn: () => getStationConsumptionByDay(stationId!),
    enabled: !!stationId && !!station,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStation(stationId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations-module"] });
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Estação excluída com sucesso.");
      navigate("/dashboard/stations");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Não foi possível excluir a estação.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateStationEnabled(id, enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["station-details", stationId],
      });
      toast.success(
        station?.enabled ? "Estação desativada." : "Estação ativada.",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao atualizar estação.");
    },
  });

  useEffect(() => {
    if (!stationId) return;

    const channelStations = supabase
      .channel(`station-command-${stationId}`)
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
        },
      )
      .subscribe();

    const channelConnectors = supabase
      .channel(`station-command-connectors-${stationId}`)
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
        },
      )
      .subscribe();

    const channelTransactions = supabase
      .channel(`station-command-tx-${stationId}`)
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
          void queryClient.invalidateQueries({
            queryKey: ["station-consumption", stationId],
          });
        },
      )
      .subscribe();

    return () => {
      channelStations.unsubscribe();
      channelConnectors.unsubscribe();
      channelTransactions.unsubscribe();
    };
  }, [stationId, queryClient]);

  const handleBack = () => navigate("/dashboard/stations");
  const handleEdit = () => {
    toast.info("Edição de estação em desenvolvimento.");
  };
  const handleToggleEnabled = () => {
    if (!stationId || !station) return;
    toggleMutation.mutate({ id: stationId, enabled: !station.enabled });
  };

  if (!stationId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={handleBack}>
          Voltar
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            ID da estação não informado.
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="h-14 animate-pulse rounded bg-muted/50" />
        <CommandCenterSkeleton />
      </motion.div>
    );
  }

  if (error || !station) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={handleBack}>
          Voltar
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Estação não encontrada ou erro ao carregar.
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const totalRevenue = computeTotalRevenue(
    station.total_kwh,
    station.cost_per_kwh,
  );
  const events = deriveEventsFromSessions(station.recent_sessions);
  const transactions = sessionsToTransactions(
    station.recent_sessions,
    station.cost_per_kwh,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <StationHeader
        name={station.name}
        status={station.status}
        lastSeen={station.last_seen}
        city={station.city}
        uf={station.uf}
        lat={station.lat}
        lng={station.lng}
        enabled={station.enabled}
        open24h={station.open_24h}
        openingTime={station.opening_time}
        closingTime={station.closing_time}
        onEdit={handleEdit}
        onToggleEnabled={handleToggleEnabled}
      />

      {station.main_photo_url && (
        <StationPhotoBanner
          mainPhotoUrl={station.main_photo_url}
          name={station.name}
        />
      )}

      {station.photo_urls && station.photo_urls.length > 0 && (
        <StationPhotoGallery photoUrls={station.photo_urls} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] lg:items-stretch">
        <div className="lg:min-w-0">
          <StationSidebar
            station={{
              charge_point_id: station.charge_point_id,
              connection_type: station.connection_type,
              external_id: station.external_id,
              station_type: station.station_type,
              station_group: station.station_group,
              vendor: station.vendor,
              model: station.model,
              firmware: station.firmware,
              enabled: station.enabled,
              enable_reservation: station.enable_reservation,
              open_24h: station.open_24h,
              street: station.street,
              address_number: station.address_number,
              city: station.city,
              uf: station.uf,
              cep: station.cep,
              country: station.country,
              lat: station.lat,
              lng: station.lng,
            }}
            onEdit={handleEdit}
            onToggleEnabled={handleToggleEnabled}
            onDelete={() => deleteMutation.mutateAsync()}
            stationName={station.name}
            canDelete={canDeleteStation}
            deletePending={deleteMutation.isPending}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:min-h-[min(720px,78vh)]">
          <StationEvents className="min-h-0 flex-1" events={events} />
          <StationTransactions className="min-h-0 flex-1" transactions={transactions} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <StationAnalytics
            dailyData={dailyConsumption}
            isLoading={consumptionLoading}
          />
          <StationMetrics
            totalSessions={station.total_sessions}
            totalKwh={station.total_kwh}
            totalRevenue={totalRevenue}
          />
          <StationFinancial
            chargeEnabled={station.charge_enabled}
            chargeType={station.charge_type}
            costPerKwh={station.cost_per_kwh}
            totalRevenue={totalRevenue}
            totalSessions={station.total_sessions}
          />
          <StationConnectors
            connectorCount={station.connector_count}
            connectors={station.connectors}
          />
        </div>
      </div>
    </motion.div>
  );
}

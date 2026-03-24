import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { statusLabels } from "./stationConstants";
import type { StationDetails } from "@/services/stationsService";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  online:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  charging:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  offline:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40",
  faulted:
    "bg-destructive/20 text-destructive border-destructive/35",
  unavailable:
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/40",
};

interface StationSpecHeaderProps {
  station: StationDetails;
  onEdit?: () => void;
  onToggleEnabled?: () => void;
}

export default function StationSpecHeader({
  station,
  onEdit,
  onToggleEnabled,
}: StationSpecHeaderProps) {
  const navigate = useNavigate();
  const statusKey = station.status.toLowerCase();
  const badgeClass =
    STATUS_BADGE_CLASSES[statusKey] ?? STATUS_BADGE_CLASSES.offline;
  const hasCoords = station.lat != null && station.lng != null;

  const handleViewMap = () => {
    if (hasCoords) {
      const url = `https://www.google.com/maps?q=${station.lat},${station.lng}`;
      window.open(url, "_blank");
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/stations")}
          aria-label="Voltar para estações"
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {station.name}
            </h1>
            <Badge
              variant="outline"
              className={`shrink-0 font-medium ${badgeClass}`}
            >
              {statusLabels[statusKey] ?? station.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {station.charge_point_id}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
        {onToggleEnabled && (
          <Button
            variant={station.enabled ? "outline" : "default"}
            size="sm"
            onClick={onToggleEnabled}
          >
            {station.enabled ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewMap}
          disabled={!hasCoords}
          title={
            hasCoords
              ? "Abrir localização no Google Maps"
              : "Coordenadas não disponíveis"
          }
        >
          <MapPin className="mr-2 h-4 w-4" />
          Ver no mapa
        </Button>
      </div>
    </motion.header>
  );
}

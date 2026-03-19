import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Pencil, Power, PowerOff, Activity } from "lucide-react";
import { motion } from "framer-motion";
import StationHealth from "./StationHealth";
import StationHorario from "./StationHorario";

const STATUS_CONFIG: Record<string, { label: string; className: string; pulse?: boolean }> = {
  online: { label: "Online", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40", pulse: true },
  charging: { label: "Carregando", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40", pulse: true },
  offline: { label: "Offline", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40" },
  faulted: { label: "Falha", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40" },
  unavailable: { label: "Indisponível", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40" },
};

function formatHeartbeat(value: string | null): string {
  if (!value) return "Sem heartbeat";
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatCityUf(city: string | null, uf: string | null): string {
  const parts = [city, uf].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "";
}

interface StationHeaderProps {
  name: string;
  status: string;
  lastSeen: string | null;
  city: string | null;
  uf: string | null;
  lat: number | null;
  lng: number | null;
  enabled: boolean;
  open24h: boolean;
  openingTime: string | null;
  closingTime: string | null;
  onEdit: () => void;
  onToggleEnabled: () => void;
}

export default function StationHeader({
  name,
  status,
  lastSeen,
  city,
  uf,
  lat,
  lng,
  enabled,
  open24h,
  openingTime,
  closingTime,
  onEdit,
  onToggleEnabled,
}: StationHeaderProps) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.offline;
  const hasCoords = lat != null && lng != null;
  const cityUf = formatCityUf(city, uf);

  const handleViewMap = () => {
    if (hasCoords) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 border-b border-border pb-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/stations")}
            aria-label="Voltar"
            className="shrink-0 mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={`font-medium ${config.className}`}>
                {config.pulse && (
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                )}
                {config.label}
              </Badge>
              <StationHealth status={status} lastSeen={lastSeen} />
              <StationHorario
                open24h={open24h}
                openingTime={openingTime}
                closingTime={closingTime}
              />
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                {formatHeartbeat(lastSeen)}
              </span>
              {cityUf && (
                <span className="text-sm text-muted-foreground">
                  {cityUf}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant={enabled ? "outline" : "default"}
            size="sm"
            onClick={onToggleEnabled}
          >
            {enabled ? (
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewMap}
            disabled={!hasCoords}
            title={hasCoords ? "Abrir no Google Maps" : "Coordenadas indisponíveis"}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Ver no mapa
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

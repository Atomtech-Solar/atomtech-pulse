import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Circle } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; className: string; pulse?: boolean }> = {
  online: { label: "Online", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40", pulse: true },
  offline: { label: "Offline", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40" },
  error: { label: "Erro", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40" },
};

function formatHeartbeat(value: string | null): string {
  if (!value) return "Sem heartbeat";
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface StationCommandHeaderProps {
  name: string;
  status: string;
  lastSeen: string | null;
}

export default function StationCommandHeader({
  name,
  status,
  lastSeen,
}: StationCommandHeaderProps) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.offline;
  const isLive = config.pulse ?? false;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/stations")}
          aria-label="Voltar"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={`font-medium ${config.className}`}>
              {isLive && (
                <Circle className="mr-1.5 h-1.5 w-1.5 fill-current animate-pulse" />
              )}
              {config.label}
            </Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {formatHeartbeat(lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

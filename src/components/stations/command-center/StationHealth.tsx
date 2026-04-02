import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

type HealthLevel = "healthy" | "unstable" | "offline" | "error";

interface HealthConfig {
  label: string;
  emoji: string;
  className: string;
  tooltip: string;
}

const HEALTH_CONFIG: Record<HealthLevel, HealthConfig> = {
  healthy: {
    label: "Saudável",
    emoji: "🟢",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
    tooltip: "Estação online e comunicando normalmente. Último heartbeat recente.",
  },
  unstable: {
    label: "Instável",
    emoji: "🟡",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/35",
    tooltip: "Comunicação intermitente ou indisponível. Verifique a conexão.",
  },
  offline: {
    label: "Offline",
    emoji: "🔴",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40",
    tooltip: "Estação sem comunicação. Não está enviando heartbeats.",
  },
  error: {
    label: "Erro",
    emoji: "⚠️",
    className: "bg-destructive/15 text-destructive border-destructive/40",
    tooltip: "Falha de conexão ou protocolo no charge point. Verifique o equipamento.",
  },
};

function getHealthLevel(status: string, lastSeen: string | null): HealthLevel {
  const s = status.toLowerCase();
  if (s === "error") return "error";
  if (s === "offline") return "offline";
  if (s === "online") {
    if (!lastSeen) return "unstable";
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffMin = diffMs / (1000 * 60);
    if (diffMin > 15) return "unstable";
    return "healthy";
  }
  return "offline";
}

interface StationHealthProps {
  status: string;
  lastSeen: string | null;
}

export default function StationHealth({ status, lastSeen }: StationHealthProps) {
  const level = getHealthLevel(status, lastSeen);
  const config = HEALTH_CONFIG[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Badge
              variant="outline"
              className={`cursor-help text-sm font-semibold ${config.className}`}
            >
              <span className="mr-1.5">{config.emoji}</span>
              {config.label}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

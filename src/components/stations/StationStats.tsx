import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Calendar,
  Zap,
  DollarSign,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatLastSeen } from "./stationConstants";

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="overflow-hidden transition-colors hover:border-muted-foreground/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 truncate text-xl font-semibold">{value}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StationStatsProps {
  status: string;
  lastSeen: string | null;
  totalSessions: number;
  totalKwh: number;
  totalRevenue: number | null;
}

export default function StationStats({
  status,
  lastSeen,
  totalSessions,
  totalKwh,
  totalRevenue,
}: StationStatsProps) {
  const statusLabel =
    status === "online" || status === "charging"
      ? "Online"
      : status === "faulted" || status === "unavailable"
        ? "Atenção"
        : "Offline";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        icon={Radio}
        label="Status atual"
        value={statusLabel}
        delay={0}
      />
      <StatCard
        icon={Calendar}
        label="Última comunicação"
        value={formatLastSeen(lastSeen)}
        delay={0.05}
      />
      <StatCard
        icon={Activity}
        label="Total de sessões"
        value={totalSessions.toLocaleString("pt-BR")}
        delay={0.1}
      />
      <StatCard
        icon={Zap}
        label="Energia fornecida (kWh)"
        value={totalKwh.toFixed(2)}
        delay={0.15}
      />
      <StatCard
        icon={DollarSign}
        label="Receita total"
        value={fmtMoney(totalRevenue)}
        delay={0.2}
      />
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Activity, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

interface StationMetricsProps {
  totalSessions: number;
  totalKwh: number;
  totalRevenue: number | null;
}

const metrics = [
  {
    key: "sessions",
    label: "Total de sessões",
    icon: Activity,
  },
  {
    key: "kwh",
    label: "Energia total",
    icon: Zap,
  },
  {
    key: "revenue",
    label: "Receita total",
    icon: DollarSign,
  },
] as const;

export default function StationMetrics({
  totalSessions,
  totalKwh,
  totalRevenue,
}: StationMetricsProps) {
  const values = {
    sessions: totalSessions.toLocaleString("pt-BR"),
    kwh: `${totalKwh.toFixed(1)} kWh`,
    revenue: totalRevenue != null ? fmtMoney(totalRevenue) : "—",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <Card className="overflow-hidden transition-colors hover:border-muted-foreground/20 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <m.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {values[m.key]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

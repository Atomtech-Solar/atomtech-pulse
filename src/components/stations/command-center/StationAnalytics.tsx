import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { DailyConsumption } from "./types";

interface StationAnalyticsProps {
  dailyData: DailyConsumption[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || payload[0].value === undefined) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">Dia {label}</p>
      <p className="text-sm font-semibold">{payload[0].value.toFixed(2)} kWh</p>
    </div>
  );
}

export default function StationAnalytics({
  dailyData,
  isLoading,
}: StationAnalyticsProps) {
  const hasData = dailyData.length > 0 && dailyData.some((d) => d.kwh > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="transition-colors hover:border-muted-foreground/20">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">Consumo (últimos 28 dias)</h3>
          <p className="text-xs text-muted-foreground">kWh por dia</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
          ) : !hasData ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              </motion.div>
              <p className="mt-3 text-sm font-medium">Sem dados suficientes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                O gráfico será preenchido com o histórico de carregamentos
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="kwh"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

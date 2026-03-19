import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

interface StationFinancialProps {
  chargeEnabled: boolean;
  chargeType: string | null;
  costPerKwh: number | null;
  totalRevenue: number | null;
  totalSessions: number;
}

export default function StationFinancial({
  chargeEnabled,
  chargeType,
  costPerKwh,
  totalRevenue,
  totalSessions,
}: StationFinancialProps) {
  const ticketMedio =
    totalRevenue != null && totalSessions > 0
      ? totalRevenue / totalSessions
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="transition-colors hover:border-muted-foreground/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Financeiro</h4>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cobrança ativa</span>
              <span className="font-medium">{chargeEnabled ? "Sim" : "Não"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo de cobrança</span>
              <span className="font-medium">{chargeType ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço por kWh</span>
              <span className="font-medium">
                {costPerKwh != null ? fmtMoney(costPerKwh) : "—"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Receita estimada</p>
            <p className="text-lg font-semibold">
              {totalRevenue != null ? fmtMoney(totalRevenue) : "—"}
            </p>
          </div>
          {ticketMedio != null && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-lg font-semibold">{fmtMoney(ticketMedio)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

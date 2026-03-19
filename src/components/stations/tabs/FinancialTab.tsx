import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StationDetails } from "@/services/stationsService";

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

interface FinancialTabProps {
  station: StationDetails;
  totalRevenue: number | null;
}

export default function FinancialTab({ station, totalRevenue }: FinancialTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Cobrança ativa</p>
            <p className="mt-0.5 text-sm font-medium">
              {station.charge_enabled ? "Sim" : "Não"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo de cobrança</p>
            <p className="mt-0.5 text-sm font-medium">
              {station.charge_type ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Preço por kWh</p>
            <p className="mt-0.5 text-sm font-medium">
              {fmtMoney(station.cost_per_kwh)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa por receita (%)</p>
            <p className="mt-0.5 text-sm font-medium">
              {station.revenue_tax_percent != null
                ? `${station.revenue_tax_percent}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita por início</p>
            <p className="mt-0.5 text-sm font-medium">
              {fmtMoney(station.revenue_per_start)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita por kWh</p>
            <p className="mt-0.5 text-sm font-medium">
              {fmtMoney(station.revenue_per_kwh)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Receita acumulada</p>
          <p className="mt-1 text-2xl font-semibold">
            {fmtMoney(totalRevenue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

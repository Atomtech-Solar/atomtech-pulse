import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useStations, useStationRevenue } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp } from "lucide-react";

export default function Financial() {
  const { user, selectedCompanyId } = useAuth();
  const role = user?.role ?? "viewer";
  const { data: sessions = [] } = useSessions();
  const { data: stationRevenue = [] } = useStationRevenue();
  const totalRevenue = sessions.reduce((s, se) => s + (se.revenue ?? 0), 0);
  const taxes = totalRevenue * 0.08;
  const opFees = filteredSessions.length * 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada de receitas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Receita Bruta', value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: 'Impostos', value: `R$ ${taxes.toFixed(2)}`, icon: TrendingUp },
          { label: 'Taxas Op.', value: `R$ ${opFees.toFixed(2)}`, icon: DollarSign },
          { label: 'Receita Líquida', value: `R$ ${(totalRevenue - taxes - opFees).toFixed(2)}`, icon: TrendingUp },
        ].map(m => (
          <Card key={m.label} className="border-border bg-card">
            <CardContent className="p-4">
              <m.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xl font-display font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-muted-foreground">Receita por Estação</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Estação</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stationRevenue.map(st => {
                const stRevenue = st.revenue ?? 0;
                return (
                  <TableRow key={st.station_id ?? st.name ?? ""} className="border-border">
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell>
                      {st.city}, {st.uf}
                    </TableCell>
                    <TableCell>{st.total_sessions}</TableCell>
                    <TableCell>R$ {stRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

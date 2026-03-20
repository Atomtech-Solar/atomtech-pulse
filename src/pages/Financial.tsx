import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useStationRevenue } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp } from "lucide-react";

export default function Financial() {
  const { user, selectedCompanyId } = useAuth();
  const role = user?.role ?? "viewer";
  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError, error: sessionsErrorObj, refetch: refetchSessions } = useSessions();
  const { data: stationRevenue = [], isLoading: revenueLoading, isError: revenueError, error: revenueErrorObj, refetch: refetchRevenue } = useStationRevenue();

  const isLoading = sessionsLoading || revenueLoading;
  const isError = sessionsError || revenueError;
  const errorMessage = sessionsErrorObj?.message ?? revenueErrorObj?.message ?? "Falha ao carregar dados.";
  const refetchAll = () => {
    refetchSessions();
    refetchRevenue();
  };

  const totalRevenue = sessions.reduce((s, se) => s + (se.revenue ?? 0), 0);
  const taxes = totalRevenue * 0.08;
  const opFees = sessions.length * 5;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão consolidada de receitas</p>
        </div>
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão consolidada de receitas</p>
        </div>
        <Card className="border-border border-destructive/30">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium mb-2">Falha ao carregar dados.</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <Button variant="outline" onClick={refetchAll}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada de receitas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader><CardTitle className="text-sm text-muted-foreground">Receita por Estação</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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

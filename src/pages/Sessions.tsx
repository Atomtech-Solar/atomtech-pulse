import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const statusMap = {
  active: { label: "Ativa", className: "bg-accent/20 text-accent border-accent/30" },
  completed: { label: "Finalizada", className: "bg-primary/20 text-primary border-primary/30" },
  error: { label: "Erro", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export default function Sessions() {
  const { user, selectedCompanyId } = useAuth();
  const { data: sessions = [], isLoading, isError, error, refetch } = useSessions();
  const data = sessions;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold">Sessões</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de sessões de recarga</p>
      </div>
      {isLoading ? (
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando sessões...</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-border border-destructive/30">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium mb-2">Falha ao carregar sessões.</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Tente novamente."}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Estação</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>kWh</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(s => {
                const st = statusMap[s.status as keyof typeof statusMap] ?? statusMap.completed;
                return (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="font-mono text-xs">{(s as { external_id?: string }).external_id ?? s.id}</TableCell>
                    <TableCell>{s.user_name}</TableCell>
                    <TableCell>{s.station_name}</TableCell>
                    <TableCell className="text-sm">
                      {(s as { start_time?: string; start?: string }).start_time ?? (s as { start?: string }).start
                        ? new Date(((s as { start_time?: string; start?: string }).start_time ?? (s as { start?: string }).start)!).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>{s.duration_min ?? 0} min</TableCell>
                    <TableCell>{(s.kwh ?? 0).toFixed(1)}</TableCell>
                    <TableCell>R$ {(s.revenue ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={st.className}>
                        {st.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

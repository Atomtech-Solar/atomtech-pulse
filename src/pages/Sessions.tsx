import { useAuth } from '@/contexts/AuthContext';
import { sessions, filterByCompany } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusMap = {
  active: { label: 'Ativa', className: 'bg-accent/20 text-accent border-accent/30' },
  completed: { label: 'Finalizada', className: 'bg-primary/20 text-primary border-primary/30' },
  error: { label: 'Erro', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function Sessions() {
  const { user, selectedCompanyId } = useAuth();
  const data = filterByCompany(sessions, selectedCompanyId, user?.role ?? 'viewer');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Sessões</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de sessões de recarga</p>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
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
                const st = statusMap[s.status];
                return (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell>{s.user_name}</TableCell>
                    <TableCell>{s.station_name}</TableCell>
                    <TableCell className="text-sm">{new Date(s.start).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{s.duration_min} min</TableCell>
                    <TableCell>{s.kwh.toFixed(1)}</TableCell>
                    <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
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

import { useAuth } from "@/contexts/AuthContext";
import { useEvUsers } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

export default function UsersPage() {
  const { user, selectedCompanyId } = useAuth();
  const { data: evUsers = [] } = useEvUsers();
  const data = evUsers;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">{data.length} usuários cadastrados</p>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Recargas</TableHead>
                <TableHead>kWh</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(u => (
                <TableRow key={u.id} className="border-border">
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm">{u.document}</TableCell>
                  <TableCell>
                    {u.vehicle ? (
                      <span className="text-sm">{u.vehicle}</span>
                    ) : (
                      <span className="text-sm text-chart-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Não cadastrado</span>
                    )}
                  </TableCell>
                  <TableCell>{u.sessions_count}</TableCell>
                  <TableCell>{u.total_kwh.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.status === 'active' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-muted text-muted-foreground border-muted'}>
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

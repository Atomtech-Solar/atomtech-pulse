import { useAuth } from "@/contexts/AuthContext";
import { useEvUsers } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function UsersPage() {
  const { user, selectedCompanyId } = useAuth();
  const { data: evUsers = [], isLoading, isError, error, refetch } = useEvUsers();
  const data = evUsers;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">{data.length} usuários cadastrados</p>
      </div>
      {isLoading ? (
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-border border-destructive/30">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium mb-2">Falha ao carregar usuários.</p>
            <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : "Tente novamente."}</p>
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
      )}
    </div>
  );
}

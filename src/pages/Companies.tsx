import { useCompanies } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Companies() {
  const { user } = useAuth();
  const { data: companies = [], isLoading, isError, refetch } = useCompanies();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão multi-tenant</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-destructive">Falha ao carregar empresas. Verifique as permissões no banco (RLS) e tente novamente.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão multi-tenant</p>
        </div>
        {user?.role === "super_admin" && (
          <Button className="gradient-primary text-primary-foreground glow-primary">
            <Plus className="w-4 h-4 mr-2" /> Nova Empresa
          </Button>
        )}
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estações</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : companies.map(c => (
                <TableRow key={c.id} className="border-border cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-primary" /></div>
                    {c.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.cnpj}</TableCell>
                  <TableCell>{c.city}, {c.uf}</TableCell>
                  <TableCell>{c.stations_count}</TableCell>
                  <TableCell>{c.users_count}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">{c.status === 'active' ? 'Ativa' : 'Inativa'}</Badge>
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

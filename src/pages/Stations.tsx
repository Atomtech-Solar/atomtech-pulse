import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { listStations, createStation } from "@/services/stationsService";
import {
  isSupabaseAuthError,
  dispatchSessionInvalid,
} from "@/lib/supabaseAuthUtils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  online: "bg-accent/20 text-accent border-accent/30",
  offline: "bg-destructive/20 text-destructive border-destructive/30",
  charging: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  maintenance: "bg-muted text-muted-foreground border-muted",
};

export default function StationsPage() {
  const { user, selectedCompanyId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [chargePointId, setChargePointId] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");

  const companyId =
    user?.role === "super_admin" ? selectedCompanyId : (user?.company_id ?? null);

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ["stations-module", companyId],
    queryFn: () => listStations(companyId ?? undefined),
  });

  const handleCreate = async () => {
    const cid = user?.role === "super_admin" ? selectedCompanyId : user?.company_id;
    if (!cid) {
      toast({
        title: "Selecione uma empresa",
        description: "Escolha uma empresa para cadastrar a estação.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createStation({
        name,
        charge_point_id: chargePointId || undefined,
        company_id: Number(cid),
        city: city || null,
        uf: uf || null,
      });
      toast({ title: "Estação criada", description: name });
      setDialogOpen(false);
      setName("");
      setChargePointId("");
      setCity("");
      setUf("");
      void queryClient.invalidateQueries({ queryKey: ["stations-module"] });
    } catch (err) {
      if (isSupabaseAuthError(err)) {
        dispatchSessionInvalid();
        return;
      }
      toast({
        title: "Erro ao criar estação",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Estações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerenciar carregadores veiculares (OCPP)
          </p>
        </div>
        {user?.role !== "viewer" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Estação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Estação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Estação Centro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Charge Point ID (OCCP)</Label>
                  <Input
                    value={chargePointId}
                    onChange={(e) => setChargePointId(e.target.value)}
                    placeholder="Ex: CP-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Brasília"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      placeholder="DF"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={!name.trim()}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Charge Point ID</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : stations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma estação cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                stations.map((station) => (
                  <TableRow key={station.id} className="border-border">
                    <TableCell className="font-mono text-xs">{station.id}</TableCell>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {station.charge_point_id || "—"}
                    </TableCell>
                    <TableCell>{station.company_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[station.status] ?? statusColors.offline}
                      >
                        {station.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {station.created_at
                        ? new Date(station.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Placeholder para futura subscrição realtime (Supabase Realtime ou OCPP WebSocket) */}
      {/* useEffect(() => {
        const channel = supabase.channel('stations').on('postgres_changes', { ... }, () => { queryClient.invalidateQueries(...) }).subscribe();
        return () => { channel.unsubscribe(); };
      }, []); */}
    </div>
  );
}

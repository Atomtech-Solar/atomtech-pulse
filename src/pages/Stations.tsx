import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useSupabaseData";
import { listStations, createStation } from "@/services/stationsService";
import { supabase } from "@/lib/supabaseClient";
import {
  stripUrlPrefixes,
  sanitizeChargePointId,
} from "@/lib/chargePointIdUtils";
import {
  isSupabaseAuthError,
  dispatchSessionInvalid,
} from "@/lib/supabaseAuthUtils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Plus, Info } from "lucide-react";
import type { Station } from "@/types/station";

const statusColors: Record<string, string> = {
  offline: "bg-muted text-muted-foreground border-muted",
  online:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  charging:
    "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  faulted: "bg-destructive/20 text-destructive border-destructive/30",
  unavailable:
    "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

const statusLabels: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  charging: "Carregando",
  faulted: "Falha",
  unavailable: "Indisponível",
};

function formatLastSeen(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StationsPage() {
  const navigate = useNavigate();
  const { user, selectedCompanyId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [chargePointId, setChargePointId] = useState("");
  const [chargePointIdError, setChargePointIdError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [vendor, setVendor] = useState("");
  const [model, setModel] = useState("");
  const [formCompanyId, setFormCompanyId] = useState<number | null>(null);

  const { data: companies = [] } = useCompanies();
  const companyId =
    user?.role === "super_admin" ? selectedCompanyId : (user?.company_id ?? null);

  const companiesForSelect =
    user?.role === "super_admin"
      ? companies
      : companies.filter((c) => c.id === user?.company_id);

  useEffect(() => {
    if (dialogOpen && companiesForSelect.length > 0 && !formCompanyId) {
      const defaultId =
        user?.role === "super_admin"
          ? selectedCompanyId ?? companiesForSelect[0]?.id
          : user?.company_id ?? companiesForSelect[0]?.id;
      if (defaultId != null) setFormCompanyId(defaultId);
    }
    if (!dialogOpen) setFormCompanyId(null);
  }, [dialogOpen, companiesForSelect, formCompanyId, user?.role, selectedCompanyId, user?.company_id]);

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ["stations-module", companyId],
    queryFn: () => listStations(companyId ?? undefined),
  });

  useEffect(() => {
    const channel = supabase
      .channel("station_status_updated")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stations" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const statusStr = String(row.status || "").toLowerCase();
          const validStatuses = ["offline", "online", "charging", "faulted", "unavailable"] as const;
          const status = validStatuses.includes(statusStr as (typeof validStatuses)[number])
            ? (statusStr as (typeof validStatuses)[number])
            : "offline";
          const station = {
            id: String(row.id),
            name: String(row.name || ""),
            charge_point_id: String(row.charge_point_id ?? ""),
            company_id: String(row.company_id ?? ""),
            status,
            last_seen: row.last_seen ? String(row.last_seen) : null,
            charge_point_vendor: row.charge_point_vendor ? String(row.charge_point_vendor) : null,
            charge_point_model: row.charge_point_model ? String(row.charge_point_model) : null,
            total_kwh: Number(row.total_kwh) ?? 0,
            total_sessions: Number(row.total_sessions) ?? 0,
          };
          queryClient.setQueriesData({ queryKey: ["stations-module"] }, (prev: unknown) => {
            if (!Array.isArray(prev)) return prev;
            const idx = prev.findIndex((s: Station) => String(s.id) === String(station.id));
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], ...station };
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const handleCreate = async () => {
    const cid = user?.role === "super_admin" ? formCompanyId : user?.company_id;
    if (!cid) {
      toast({
        title: "Empresa obrigatória",
        description: "Selecione uma empresa para cadastrar a estação.",
        variant: "destructive",
      });
      return;
    }
    const sanitized = sanitizeChargePointId(chargePointId);
    if (!sanitized.valid) {
      setChargePointIdError(sanitized.error);
      toast({
        title: "Charge Point ID inválido",
        description: sanitized.error,
        variant: "destructive",
      });
      return;
    }
    setChargePointIdError(null);
    try {
      await createStation({
        name: name.trim(),
        charge_point_id: sanitized.id,
        company_id: Number(cid),
        city: city.trim() || null,
        uf: uf.trim().toUpperCase().slice(0, 2) || null,
        charge_point_vendor: vendor.trim() || null,
        charge_point_model: model.trim() || null,
      });
      toast({ title: "Estação criada", description: name });
      setDialogOpen(false);
      setName("");
      setChargePointId("");
      setChargePointIdError(null);
      setCity("");
      setUf("");
      setVendor("");
      setModel("");
      setFormCompanyId(null);
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

  const handleRowClick = (station: Station) => {
    if (station.charge_point_id) {
      navigate(`/dashboard/stations/${station.charge_point_id}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Estações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerenciar carregadores OCPP 1.6 conectados ao backend
          </p>
        </div>
        {user?.role !== "viewer" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-primary w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Estação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Estação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border border-muted bg-muted/30 p-3 flex gap-2">
                  <Info className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    O Charge Point ID deve ser exatamente o mesmo configurado no carregador físico OCPP.
                    Exemplo: se o carregador usa <code className="font-mono bg-muted px-1 rounded">CP001</code>,
                    a conexão será feita em{" "}
                    <code className="font-mono bg-muted px-1 rounded text-xs">wss://backend/ocpp/CP001</code>.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station-company">Empresa *</Label>
                  <Select
                    value={formCompanyId?.toString() ?? ""}
                    onValueChange={(v) => setFormCompanyId(v ? Number(v) : null)}
                  >
                    <SelectTrigger id="station-company">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companiesForSelect.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station-name">Nome da estação *</Label>
                  <Input
                    id="station-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Estação Centro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charge-point-id">Charge Point ID (ID do carregador OCPP) *</Label>
                  <Input
                    id="charge-point-id"
                    value={chargePointId}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const stripped = stripUrlPrefixes(raw);
                      setChargePointId(stripped !== raw ? stripped : raw);
                      setChargePointIdError(null);
                    }}
                    onBlur={() => {
                      if (chargePointId.trim()) {
                        const result = sanitizeChargePointId(chargePointId);
                        setChargePointIdError(result.valid ? null : result.error);
                      } else {
                        setChargePointIdError(null);
                      }
                    }}
                    placeholder="Ex: CP001, charger001"
                    className={chargePointIdError ? "border-destructive" : ""}
                  />
                  {chargePointIdError && (
                    <p className="text-sm text-destructive">{chargePointIdError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="station-vendor">Fabricante (opcional)</Label>
                    <Input
                      id="station-vendor"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Ex: Atomtech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-model">Modelo (opcional)</Label>
                    <Input
                      id="station-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: Simulador"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="station-city">Cidade (opcional)</Label>
                    <Input
                      id="station-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-uf">UF (opcional)</Label>
                    <Input
                      id="station-uf"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  O status é atualizado automaticamente pelo backend OCPP quando o carregador conecta,
                  desconecta ou inicia sessão de carregamento.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      !name.trim() ||
                      !chargePointId.trim() ||
                      !formCompanyId ||
                      !!chargePointIdError ||
                      !sanitizeChargePointId(chargePointId).valid
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Charge Point ID</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último contato</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Energia (kWh)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : stations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma estação cadastrada. Adicione uma estação para começar.
                  </TableCell>
                </TableRow>
              ) : (
                stations.map((station) => (
                  <TableRow
                    key={station.id}
                    className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(station)}
                  >
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {station.charge_point_id || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {station.charge_point_vendor || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {station.charge_point_model || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[station.status] ?? statusColors.offline}
                      >
                        {statusLabels[station.status] ?? station.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastSeen(station.last_seen)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {station.total_sessions}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(station.total_kwh).toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

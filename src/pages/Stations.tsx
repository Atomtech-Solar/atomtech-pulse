import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const STALE_TIME_MS = 60000;

export default function StationsPage() {
  const { user, selectedCompanyId, isSessionReady } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
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
    const state = location.state as { openNewDialog?: boolean } | undefined;
    if (state?.openNewDialog) {
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

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

  const {
    data: stations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stations-module", user?.id, companyId],
    queryFn: () => listStations(companyId ?? undefined),
    enabled: isSessionReady && !!user,
    staleTime: STALE_TIME_MS,
  });

  useEffect(() => {
    const channelStations = supabase
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

    const channelConnectors = supabase
      .channel("connector_status_updated")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "connectors" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const stationId = String(row.station_id);
          const connector = {
            connector_id: Number(row.connector_id),
            status: String(row.status ?? "available"),
            energy_kwh: Number(row.energy_kwh) ?? 0,
            power_kw: Number(row.power_kw) ?? 0,
            current_transaction_id: row.current_transaction_id as number | null | undefined,
          };
          queryClient.setQueriesData({ queryKey: ["stations-module"] }, (prev: unknown) => {
            if (!Array.isArray(prev)) return prev;
            const idx = prev.findIndex((s: Station) => String(s.id) === stationId);
            if (idx === -1) return prev;
            const next = [...prev];
            const st = next[idx] as Station;
            const conns = [...(st.connectors ?? [])];
            const ci = conns.findIndex((c) => c.connector_id === connector.connector_id);
            if (ci >= 0) conns[ci] = connector;
            else conns.push(connector);
            conns.sort((a, b) => a.connector_id - b.connector_id);
            next[idx] = { ...st, connectors: conns };
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      channelStations.unsubscribe();
      channelConnectors.unsubscribe();
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

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="border-border">
            <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Carregando estações...</p>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-border border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive font-medium mb-2">Falha ao carregar estações.</p>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Tente novamente."}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : stations.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma estação cadastrada. Adicione uma estação para começar.
            </CardContent>
          </Card>
        ) : (
          stations.map((station) => (
            <Link key={station.id} to={`/dashboard/station/${station.id}`}>
            <Card
              className="border-border cursor-pointer transition-colors hover:border-primary/50"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{station.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {station.charge_point_id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {station.charge_point_vendor || "—"} / {station.charge_point_model || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusColors[station.status] ?? statusColors.offline}
                    >
                      {statusLabels[station.status] ?? station.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatLastSeen(station.last_seen)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(station.connectors ?? []).map((conn) => (
                    <div
                      key={conn.connector_id}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          Conector {conn.connector_id}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            conn.status === "charging"
                              ? statusColors.charging
                              : conn.status === "available"
                                ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {conn.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p>Energia: {conn.energy_kwh.toFixed(2)} kWh</p>
                        {conn.power_kw > 0 && (
                          <p>Potência: {conn.power_kw} kW</p>
                        )}
                        {conn.current_transaction_id && (
                          <p>Sessão ativa</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex gap-4 text-sm text-muted-foreground">
                  <span>{station.total_sessions} sessões</span>
                  <span>{Number(station.total_kwh).toFixed(1)} kWh total</span>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

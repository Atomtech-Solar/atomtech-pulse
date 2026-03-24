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
import { formatCep, parseCep } from "@/lib/formatCep";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
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
  const [connectorCount, setConnectorCount] = useState<string>("");
  const [formCompanyId, setFormCompanyId] = useState<number | null>(null);

  // Geral (1/4)
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [externalId, setExternalId] = useState("");
  const [stationType, setStationType] = useState<"public" | "private">("public");
  const [stationGroup, setStationGroup] = useState("");
  const [enableReservation, setEnableReservation] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [showChargePercentage, setShowChargePercentage] = useState(false);
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [open24h, setOpen24h] = useState(true);

  // Endereço (2/4)
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [showLocation, setShowLocation] = useState(true);

  // Pagamento (3/4) — tipo e custo sempre ativos; switch só para receita
  const [chargeType, setChargeType] = useState<"kwh" | "min">("kwh");
  const [costPerKwh, setCostPerKwh] = useState("");
  const [revenueEnabled, setRevenueEnabled] = useState(false);
  const [revenueChargeType, setRevenueChargeType] = useState<"estação" | "conector">("estação");
  const [revenuePerStart, setRevenuePerStart] = useState("");
  const [revenueTaxPercent, setRevenueTaxPercent] = useState("");
  const [revenuePerKwh, setRevenuePerKwh] = useState("");

  // Fotos (4/4) — upload de arquivos
  const [mainPhotoFile, setMainPhotoFile] = useState<File | null>(null);
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

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
    setUploadProgress(true);
    const SUBMIT_TIMEOUT_MS = 30000;

    try {
      const numConnectors = connectorCount.trim() ? parseInt(connectorCount, 10) : null;
      const costNum = costPerKwh.trim() ? Number(costPerKwh.replace(",", ".")) : null;
      const chargeEnabled = costNum != null && costNum > 0;

      let mainPhotoUrl: string | null = null;
      const photoUrls: string[] = [];

      if (mainPhotoFile) {
        try {
          console.log("[Stations] Upload foto principal:", mainPhotoFile.name);
          const path = `stations/${Date.now()}-${mainPhotoFile.name}`;
          const { data, error } = await supabase.storage
            .from("station-photos")
            .upload(path, mainPhotoFile, { upsert: false });
          if (error) throw new Error(`Falha no upload da foto principal: ${error.message}`);
          const { data: pub } = supabase.storage.from("station-photos").getPublicUrl(data.path);
          mainPhotoUrl = pub.publicUrl;
          console.log("[Stations] Foto principal enviada:", mainPhotoUrl);
        } catch (photoErr) {
          console.warn("[Stations] Upload foto principal falhou, continuando sem foto:", photoErr);
          toast({ title: "Aviso", description: "Foto principal não enviada. Estação será criada sem foto." });
        }
      }
      for (let i = 0; i < extraPhotoFiles.length; i++) {
        try {
          const f = extraPhotoFiles[i];
          const path = `stations/${Date.now()}-${i}-${f.name}`;
          const { data, error } = await supabase.storage
            .from("station-photos")
            .upload(path, f, { upsert: false });
          if (error) throw new Error(`Falha no upload da foto ${i + 1}: ${error.message}`);
          const { data: pub } = supabase.storage.from("station-photos").getPublicUrl(data.path);
          photoUrls.push(pub.publicUrl);
        } catch (photoErr) {
          console.warn("[Stations] Upload foto extra falhou:", photoErr);
        }
      }

      const payload = {
        name: name.trim(),
        charge_point_id: sanitized.id,
        company_id: Number(cid),
        city: city.trim() || null,
        uf: uf.trim().toUpperCase().slice(0, 2) || null,
        charge_point_vendor: vendor.trim() || null,
        charge_point_model: model.trim() || null,
        connector_count: numConnectors != null && numConnectors > 0 ? numConnectors : undefined,
        website_url: websiteUrl.trim() || null,
        description: description.trim() || null,
        external_id: externalId.trim() || null,
        station_type: stationType,
        station_group: stationGroup.trim() || null,
        enable_reservation: enableReservation,
        enabled: enabled,
        show_charge_percentage: showChargePercentage,
        opening_time: open24h ? null : (openingTime.trim() || null),
        closing_time: open24h ? null : (closingTime.trim() || null),
        open_24h: open24h,
        cep: cep.trim() ? parseCep(cep) : null,
        street: street.trim() || null,
        address_number: addressNumber.trim() || null,
        country: country.trim() || null,
        lat: lat.trim() ? Number(lat) : null,
        lng: lng.trim() ? Number(lng) : null,
        show_location: showLocation,
        charge_enabled: chargeEnabled,
        charge_type: chargeType,
        cost_per_kwh: costNum,
        revenue_charge_type: revenueEnabled ? revenueChargeType : null,
        revenue_per_start: revenueEnabled && revenuePerStart.trim() ? Number(revenuePerStart.replace(",", ".")) : null,
        revenue_tax_percent: revenueEnabled && revenueTaxPercent.trim() ? Number(revenueTaxPercent.replace(",", ".")) : null,
        revenue_per_kwh: revenueEnabled && revenueChargeType === "estação" && revenuePerKwh.trim() ? Number(revenuePerKwh.replace(",", ".")) : null,
        main_photo_url: mainPhotoUrl,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
      };
      console.log("[Stations] Enviando payload:", payload);

      const createPromise = createStation(payload);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite excedido (30s). Verifique sua conexão.")), SUBMIT_TIMEOUT_MS)
      );
      const station = await Promise.race([createPromise, timeoutPromise]);
      console.log("[Stations] Estação criada com sucesso:", station);

      toast({ title: "Estação cadastrada com sucesso", description: name });
      setDialogOpen(false);
      setName("");
      setChargePointId("");
      setChargePointIdError(null);
      setCity("");
      setUf("");
      setVendor("");
      setModel("");
      setConnectorCount("");
      setFormCompanyId(null);
      setWebsiteUrl("");
      setDescription("");
      setExternalId("");
      setStationType("public");
      setStationGroup("");
      setEnableReservation(false);
      setEnabled(true);
      setShowChargePercentage(false);
      setOpeningTime("");
      setClosingTime("");
      setOpen24h(true);
      setCep("");
      setStreet("");
      setAddressNumber("");
      setCountry("Brasil");
      setLat("");
      setLng("");
      setShowLocation(true);
      setChargeType("kwh");
      setCostPerKwh("");
      setRevenueEnabled(false);
      setRevenueChargeType("estação");
      setRevenuePerStart("");
      setRevenueTaxPercent("");
      setRevenuePerKwh("");
      setMainPhotoFile(null);
      setExtraPhotoFiles([]);
      void queryClient.invalidateQueries({ queryKey: ["stations-module"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      console.error("[Stations] Erro ao criar estação:", err);
      if (isSupabaseAuthError(err)) {
        dispatchSessionInvalid();
      } else {
        toast({
          title: "Erro ao cadastrar estação",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setUploadProgress(false);
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
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setConnectorCount("");
                setWebsiteUrl("");
                setDescription("");
                setExternalId("");
                setStationType("public");
                setStationGroup("");
                setEnableReservation(false);
                setEnabled(true);
                setShowChargePercentage(false);
                setOpeningTime("");
                setClosingTime("");
                setOpen24h(true);
                setCep("");
                setStreet("");
                setAddressNumber("");
                setCountry("Brasil");
                setLat("");
                setLng("");
                setShowLocation(true);
                setChargeType("kwh");
                setCostPerKwh("");
                setRevenueEnabled(false);
                setRevenueChargeType("estação");
                setRevenuePerStart("");
                setRevenueTaxPercent("");
                setRevenuePerKwh("");
                setMainPhotoFile(null);
                setExtraPhotoFiles([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-primary w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Estação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Estação</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="geral" className="text-xs sm:text-sm">Geral 1/4</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço 2/4</TabsTrigger>
                  <TabsTrigger value="pagamento">Pagamento 3/4</TabsTrigger>
                  <TabsTrigger value="fotos">Fotos 4/4</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-muted bg-muted/30 p-3 flex gap-2">
                    <Info className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      O Charge Point ID deve ser exatamente o mesmo configurado no carregador físico OCPP.
                      Ex.: <code className="font-mono bg-muted px-1 rounded">CP001</code> →{" "}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charge-point-id">Código de identificação / Charge Point ID *</Label>
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
                        } else setChargePointIdError(null);
                      }}
                      placeholder="Ex: CP001"
                      className={chargePointIdError ? "border-destructive" : ""}
                    />
                    {chargePointIdError && (
                      <p className="text-sm text-destructive">{chargePointIdError}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-website">Endereço web</Label>
                      <Input
                        id="station-website"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-external-id">ID Externo</Label>
                      <Input
                        id="station-external-id"
                        value={externalId}
                        onChange={(e) => setExternalId(e.target.value)}
                        placeholder="Ex: EXT-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-description">Descrição</Label>
                    <Input
                      id="station-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descrição da estação"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-type">Tipo</Label>
                      <Select
                        value={stationType}
                        onValueChange={(v) => setStationType(v as "public" | "private")}
                      >
                        <SelectTrigger id="station-type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Público</SelectItem>
                          <SelectItem value="private">Privado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-group">Grupo da Estação</Label>
                      <Input
                        id="station-group"
                        value={stationGroup}
                        onChange={(e) => setStationGroup(e.target.value)}
                        placeholder="Ex: Centro"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-connector-count">Número de bocas (opcional)</Label>
                    <Input
                      id="station-connector-count"
                      type="number"
                      min={1}
                      max={32}
                      value={connectorCount}
                      onChange={(e) => setConnectorCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="Deixe vazio para detectar ao conectar"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-vendor">Fabricante</Label>
                      <Input
                        id="station-vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        placeholder="Ex: Atomtech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-model">Modelo</Label>
                      <Input
                        id="station-model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Ex: Simulador"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="enable-reservation" checked={enableReservation} onCheckedChange={setEnableReservation} />
                      <Label htmlFor="enable-reservation">Habilitar reserva</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                      <Label htmlFor="enabled">Habilitar estação</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="show-charge-pct" checked={showChargePercentage} onCheckedChange={setShowChargePercentage} />
                      <Label htmlFor="show-charge-pct">Mostrar % de recarga</Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch id="open-24h" checked={open24h} onCheckedChange={setOpen24h} />
                      <Label htmlFor="open-24h">Aberto 24 horas</Label>
                    </div>
                    {!open24h && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Horário de abertura</Label>
                          <Input
                            type="time"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horário de fechamento</Label>
                          <Input
                            type="time"
                            value={closingTime}
                            onChange={(e) => setClosingTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-cep">CEP</Label>
                      <Input
                        id="station-cep"
                        value={cep}
                        onChange={(e) => setCep(formatCep(e.target.value))}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-number">Número</Label>
                      <Input
                        id="station-number"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-street">Rua</Label>
                    <Input
                      id="station-street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua Exemplo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-city">Cidade</Label>
                      <Input
                        id="station-city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-uf">UF</Label>
                      <Input
                        id="station-uf"
                        value={uf}
                        onChange={(e) => setUf(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-country">País</Label>
                    <Input
                      id="station-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Brasil"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-lat">Latitude</Label>
                      <Input
                        id="station-lat"
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="-23.5505"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-lng">Longitude</Label>
                      <Input
                        id="station-lng"
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="-46.6333"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="show-location" checked={showLocation} onCheckedChange={setShowLocation} />
                    <Label htmlFor="show-location">Mostrar localização</Label>
                  </div>
                </TabsContent>

                <TabsContent value="pagamento" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Tipo de cobrança</Label>
                    <Select value={chargeType} onValueChange={(v) => setChargeType(v as "kwh" | "min")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kwh">kWh</SelectItem>
                        <SelectItem value="min">Por minuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost-per-kwh">Custo (R$) por kWh</Label>
                    <Input
                      id="cost-per-kwh"
                      value={costPerKwh}
                      onChange={(e) => setCostPerKwh(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch id="revenue-enabled" checked={revenueEnabled} onCheckedChange={setRevenueEnabled} />
                    <Label htmlFor="revenue-enabled">Habilitar cobrança de receita</Label>
                  </div>
                  {revenueEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de cobrança para receita</Label>
                        <Select
                          value={revenueChargeType}
                          onValueChange={(v) => setRevenueChargeType(v as "estação" | "conector")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="estação">Estação</SelectItem>
                            <SelectItem value="conector">Conector</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="revenue-per-start">Receita (R$) por início de recarga</Label>
                          <Input
                            id="revenue-per-start"
                            value={revenuePerStart}
                            onChange={(e) => setRevenuePerStart(e.target.value)}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="revenue-tax">Taxa por receita (%)</Label>
                          <Input
                            id="revenue-tax"
                            value={revenueTaxPercent}
                            onChange={(e) => setRevenueTaxPercent(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {revenueChargeType === "estação" && (
                        <div className="space-y-2">
                          <Label htmlFor="revenue-per-kwh">Receita (R$) por kWh</Label>
                          <Input
                            id="revenue-per-kwh"
                            value={revenuePerKwh}
                            onChange={(e) => setRevenuePerKwh(e.target.value)}
                            placeholder="0,00"
                          />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="fotos" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="main-photo">Foto principal</Label>
                    <Input
                      id="main-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setMainPhotoFile(e.target.files?.[0] ?? null)}
                    />
                    {mainPhotoFile && (
                      <p className="text-xs text-muted-foreground">{mainPhotoFile.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extra-photos">Outras fotos</Label>
                    <Input
                      id="extra-photos"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={(e) =>
                        setExtraPhotoFiles(Array.from(e.target.files ?? []))
                      }
                    />
                    {extraPhotoFiles.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {extraPhotoFiles.length} arquivo(s) selecionado(s)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPEG, PNG, WebP, GIF. Máx. 5 MB por arquivo.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    uploadProgress ||
                    !name.trim() ||
                    !chargePointId.trim() ||
                    !formCompanyId ||
                    !!chargePointIdError ||
                    !sanitizeChargePointId(chargePointId).valid
                  }
                >
                  {uploadProgress ? "Enviando…" : "Adicionar"}
                </Button>
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

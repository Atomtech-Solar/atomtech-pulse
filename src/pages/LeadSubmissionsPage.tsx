import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownAZ,
  ArrowUpDown,
  CalendarRange,
  Columns3,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadSubmissions } from "@/hooks/useLeadSubmissions";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LeadSubmissionRow } from "@/services/leadSubmissionsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import {
  INTEREST_LABELS,
  interestBadgeClass,
  LEAD_STATUS_LABEL,
  leadStatusBadgeClass,
  extractLeadCity,
  extractLeadState,
  extractInvestmentRange,
  investmentRangeLabel,
  powerTypeLabel,
  placeTypeLabel,
  boolLabel,
} from "@/lib/leadSubmissionUi";
import { LEAD_INTEREST_OPTIONS } from "@/constants/leadInterests";
import { STORAGE_KEY_LEADS_COLUMNS } from "@/lib/authStorageKeys";
import { cn } from "@/lib/utils";

const COL_STORAGE = STORAGE_KEY_LEADS_COLUMNS;

export type LeadColumnId =
  | "name"
  | "phone"
  | "email"
  | "interest_type"
  | "lead_status"
  | "created_at"
  | "city"
  | "state"
  | "investment_range"
  | "place_type"
  | "power_type"
  | "has_location"
  | "message_preview"
  | "company_id";

const ALL_COLUMNS: { id: LeadColumnId; label: string; defaultOn: boolean }[] = [
  { id: "name", label: "Nome", defaultOn: true },
  { id: "phone", label: "Telefone", defaultOn: true },
  { id: "email", label: "E-mail", defaultOn: true },
  { id: "interest_type", label: "Tipo de interesse", defaultOn: true },
  { id: "lead_status", label: "Status", defaultOn: true },
  { id: "created_at", label: "Data de envio", defaultOn: true },
  { id: "city", label: "Cidade", defaultOn: false },
  { id: "state", label: "Estado (UF)", defaultOn: false },
  { id: "investment_range", label: "Faixa de investimento", defaultOn: false },
  { id: "place_type", label: "Tipo de local (inst.)", defaultOn: false },
  { id: "power_type", label: "Rede elétrica", defaultOn: false },
  { id: "has_location", label: "Possui local (inv.)", defaultOn: false },
  { id: "message_preview", label: "Mensagem (trecho)", defaultOn: false },
  { id: "company_id", label: "ID empresa", defaultOn: false },
];

function loadVisibleColumns(): Set<LeadColumnId> {
  try {
    const raw = localStorage.getItem(COL_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return new Set(parsed.filter((x): x is LeadColumnId => ALL_COLUMNS.some((c) => c.id === x)));
    }
  } catch {
    /* ignore */
  }
  return new Set(ALL_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id));
}

function saveVisibleColumns(cols: Set<LeadColumnId>) {
  try {
    localStorage.setItem(COL_STORAGE, JSON.stringify([...cols]));
  } catch {
    /* ignore */
  }
}

function formatDateCell(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function getData(row: LeadSubmissionRow): Record<string, unknown> {
  const d = row.data;
  if (d == null || typeof d !== "object" || Array.isArray(d)) return {};
  return d as Record<string, unknown>;
}

function cellValue(row: LeadSubmissionRow, col: LeadColumnId): string {
  const d = getData(row);
  switch (col) {
    case "name":
      return row.name;
    case "phone":
      return row.phone;
    case "email":
      return row.email ?? "—";
    case "interest_type":
      return INTEREST_LABELS[row.interest_type as keyof typeof INTEREST_LABELS] ?? row.interest_type;
    case "lead_status":
      return LEAD_STATUS_LABEL[(row.lead_status as keyof typeof LEAD_STATUS_LABEL) ?? "new"] ?? row.lead_status ?? "—";
    case "created_at":
      return formatDateCell(row.created_at);
    case "city":
      return extractLeadCity(row.interest_type, row.data) || "—";
    case "state":
      return extractLeadState(row.interest_type, row.data) || "—";
    case "investment_range": {
      const r = extractInvestmentRange(row.interest_type, row.data);
      return r ? investmentRangeLabel(r) : "—";
    }
    case "place_type": {
      if (row.interest_type !== "avaliar_instalacao") return "—";
      const v = d.place_type;
      return typeof v === "string" ? placeTypeLabel(v) : "—";
    }
    case "power_type": {
      if (row.interest_type !== "avaliar_instalacao") return "—";
      const v = d.power_type;
      return typeof v === "string" ? powerTypeLabel(v) : "—";
    }
    case "has_location": {
      if (row.interest_type !== "investir") return "—";
      return boolLabel(d.has_location);
    }
    case "message_preview": {
      const m = row.message?.trim() ?? "";
      return m.length > 80 ? `${m.slice(0, 80)}…` : m || "—";
    }
    case "company_id":
      return row.company_id != null ? String(row.company_id) : "—";
    default:
      return "—";
  }
}

function rowMatchesSearch(row: LeadSubmissionRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [row.name, row.phone, row.email ?? ""].join(" ").toLowerCase();
  return hay.includes(s);
}

function exportCsv(rows: LeadSubmissionRow[], visible: Set<LeadColumnId>) {
  const cols = ALL_COLUMNS.filter((c) => visible.has(c.id));
  const header = cols.map((c) => c.label);
  const lines = [header.join(";")];
  for (const row of rows) {
    const line = cols.map((c) => {
      const v = cellValue(row, c.id).replaceAll('"', '""');
      return `"${v}"`;
    });
    lines.push(line.join(";"));
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `leads-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function LeadSubmissionsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: leads = [], isLoading, isError, error, refetch } = useLeadSubmissions();

  const [search, setSearch] = useState("");
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [investRangeFilter, setInvestRangeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "interest_type">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [visibleCols, setVisibleCols] = useState<Set<LeadColumnId>>(loadVisibleColumns);
  const [detail, setDetail] = useState<LeadSubmissionRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    saveVisibleColumns(visibleCols);
  }, [visibleCols]);

  const toggleCol = useCallback((id: LeadColumnId, checked: boolean) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      if (next.size === 0) return prev;
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...leads];

    if (interestFilter !== "all") {
      list = list.filter((r) => r.interest_type === interestFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => (r.lead_status ?? "new") === statusFilter);
    }
    if (search.trim()) {
      list = list.filter((r) => rowMatchesSearch(r, search));
    }
    if (cityFilter.trim()) {
      const c = cityFilter.trim().toLowerCase();
      list = list.filter((r) => extractLeadCity(r.interest_type, r.data).toLowerCase().includes(c));
    }
    if (stateFilter.trim()) {
      const st = stateFilter.trim().toLowerCase();
      list = list.filter((r) => extractLeadState(r.interest_type, r.data).toLowerCase().includes(st));
    }
    if (investRangeFilter !== "all") {
      list = list.filter((r) => extractInvestmentRange(r.interest_type, r.data) === investRangeFilter);
    }
    if (dateFrom) {
      const t = new Date(dateFrom).getTime();
      list = list.filter((r) => new Date(r.created_at).getTime() >= t);
    }
    if (dateTo) {
      const t = new Date(dateTo);
      t.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.created_at).getTime() <= t.getTime());
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name, "pt-BR");
      } else {
        cmp = a.interest_type.localeCompare(b.interest_type);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    leads,
    interestFilter,
    statusFilter,
    search,
    cityFilter,
    stateFilter,
    investRangeFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
  ]);

  const openDetail = (row: LeadSubmissionRow) => {
    setDetail(row);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!detail || !sheetOpen) return;
    const fresh = leads.find((l) => l.id === detail.id);
    if (
      fresh &&
      (fresh.lead_status !== detail.lead_status ||
        fresh.updated_at !== detail.updated_at ||
        fresh.message !== detail.message)
    ) {
      setDetail(fresh);
    }
  }, [leads, detail, sheetOpen]);

  const orderedVisible = ALL_COLUMNS.filter((c) => visibleCols.has(c.id));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Leads recebidos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Formulários de interesse da landing — análise e priorização
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered, visibleCols)} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Combine filtros e busca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de interesse</Label>
              <Select value={interestFilter} onValueChange={setInterestFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {LEAD_INTEREST_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(LEAD_STATUS_LABEL) as (keyof typeof LEAD_STATUS_LABEL)[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LEAD_STATUS_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Faixa de investimento</Label>
              <Select value={investRangeFilter} onValueChange={setInvestRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ate_10k">Até R$ 10 mil</SelectItem>
                  <SelectItem value="10k_50k">R$ 10 mil – R$ 50 mil</SelectItem>
                  <SelectItem value="50k_mais">Acima de R$ 50 mil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <CalendarRange className="w-3 h-3" />
                Data inicial
              </Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data final</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade (campo dinâmico)</Label>
              <Input placeholder="Contém…" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado / UF</Label>
              <Input placeholder="Ex.: SP" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de envio</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="interest_type">Tipo de interesse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-0.5"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              {sortDir === "asc" ? <ArrowDownAZ className="w-4 h-4 mr-1" /> : <ArrowUpDown className="w-4 h-4 mr-1" />}
              {sortDir === "asc" ? "Crescente" : "Decrescente"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-base sm:text-lg">Registros ({filtered.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Clique em uma linha ou card para ver o detalhe.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="w-4 h-4 mr-2" />
                Colunas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">Colunas visíveis</p>
              <ScrollArea className="h-[280px] pr-3">
                <div className="space-y-2">
                  {ALL_COLUMNS.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={visibleCols.has(c.id)}
                        onCheckedChange={(ch) => toggleCol(c.id, ch === true)}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex justify-center text-muted-foreground text-sm">Carregando leads…</div>
          ) : isError ? (
            <div className="py-12 px-4 text-center text-destructive text-sm">
              {error instanceof Error ? error.message : "Erro ao carregar."}
              <Button variant="link" className="block mx-auto mt-2" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : isMobile ? (
            <div className="divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">Nenhum lead com os filtros atuais.</p>
              ) : (
                filtered.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => openDetail(row)}
                    className="w-full text-left px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium">{row.name}</span>
                      <Badge variant="outline" className={cn("shrink-0 border", interestBadgeClass(row.interest_type))}>
                        {INTEREST_LABELS[row.interest_type as keyof typeof INTEREST_LABELS] ?? row.interest_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.email ?? "—"}</p>
                    <p className="text-xs mt-2 text-muted-foreground">{formatDateCell(row.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {orderedVisible.map((c) => (
                      <TableHead key={c.id} className="whitespace-nowrap px-3 sm:px-4">
                        {c.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={Math.max(orderedVisible.length, 1)} className="text-center py-12 text-muted-foreground">
                        Nenhum lead com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-border cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(row)}
                      >
                        {orderedVisible.map((c) => (
                          <TableCell key={c.id} className="px-3 sm:px-4 max-w-[220px] truncate text-sm">
                            {c.id === "interest_type" ? (
                              <Badge variant="outline" className={cn("border font-normal", interestBadgeClass(row.interest_type))}>
                                {cellValue(row, c.id)}
                              </Badge>
                            ) : c.id === "lead_status" ? (
                              <Badge variant="outline" className={cn("border font-normal", leadStatusBadgeClass(row.lead_status ?? "new"))}>
                                {cellValue(row, c.id)}
                              </Badge>
                            ) : (
                              cellValue(row, c.id)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDetailSheet lead={detail} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

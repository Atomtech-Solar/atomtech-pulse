import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfilesForAdmin } from "@/hooks/useSupabaseData";
import {
  computeLandingMetrics,
  getAccountType,
  type ProfileWithCompany,
  type LandingMetrics,
} from "@/services/landingAnalyticsService";
import { exportLandingToPdf, exportLandingToExcel } from "@/lib/exportLandingReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  User,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default function LandingPageAnalytics() {
  const { user } = useAuth();
  const { data: profiles = [], isLoading, isError, refetch } = useProfilesForAdmin();
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithCompany | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const metrics: LandingMetrics = useMemo(
    () => computeLandingMetrics(profiles),
    [profiles]
  );

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportLandingToPdf(profiles, metrics);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await exportLandingToExcel(profiles, metrics);
    } finally {
      setExportingExcel(false);
    }
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito ao Admin Supremo.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-center text-destructive">
          Erro ao carregar dados. Verifique as permissões no banco (RLS em profiles/companies) e tente novamente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Landing Page Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas e cadastros captados pela landing page
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="w-full sm:w-auto shrink-0"
          >
            <FileDown className="w-4 h-4 mr-2 shrink-0" />
            <span className="truncate">{exportingPdf ? "Exportando…" : "Exportar PDF"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="w-full sm:w-auto shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 shrink-0" />
            <span className="truncate">{exportingExcel ? "Exportando…" : "Exportar Excel"}</span>
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de cadastros</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{metrics.today}</p>
            <p className="text-xs text-muted-foreground mt-1">Hoje</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{metrics.thisWeek}</p>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{metrics.thisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3 shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {metrics.byType.pessoaFisica}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pessoa física</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-chart-4 shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {metrics.byType.empresa}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Empresa</p>
          </CardContent>
        </Card>
      </div>

      {/* Listagem */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Cadastros
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Clique em um registro para ver os detalhes. Exportação considera os dados exibidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="px-3 sm:px-4">Nome</TableHead>
                <TableHead className="px-3 sm:px-4 whitespace-nowrap">Email</TableHead>
                <TableHead className="px-3 sm:px-4">Tipo</TableHead>
                <TableHead className="px-3 sm:px-4 whitespace-nowrap">Data cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum cadastro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((p) => (
                  <TableRow
                    key={p.user_id}
                    className="border-border cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelectedProfile(p)}
                  >
                    <TableCell className="font-medium px-3 sm:px-4 min-w-[80px] truncate max-w-[140px] sm:max-w-none" title={String(p.name ?? "-")}>{p.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground px-3 sm:px-4 min-w-[120px] truncate max-w-[160px] sm:max-w-none" title={p.email}>{p.email}</TableCell>
                    <TableCell className="px-3 sm:px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          getAccountType(p) === "Empresa"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {getAccountType(p)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground px-3 sm:px-4 whitespace-nowrap text-xs sm:text-sm">
                      {formatDate(p.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sheet de detalhes */}
      <Sheet open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <SheetContent side="right" className="w-[calc(100vw-2rem)] max-w-md overflow-y-auto">
          {selectedProfile && (
            <>
              <SheetHeader>
                <SheetTitle>Detalhes do cadastro</SheetTitle>
                <SheetDescription>Informações do usuário captado pela landing.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nome
                  </p>
                  <p className="text-foreground mt-1">{selectedProfile.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </p>
                  <p className="text-foreground mt-1">{selectedProfile.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </p>
                  <p className="text-foreground mt-1">{getAccountType(selectedProfile)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Data de cadastro
                  </p>
                  <p className="text-foreground mt-1">{formatDate(selectedProfile.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Telefone
                  </p>
                  <p className="text-foreground mt-1">{selectedProfile.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Empresa
                  </p>
                  <p className="text-foreground mt-1">
                    {selectedProfile.company?.name ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Papel (role)
                  </p>
                  <p className="text-foreground mt-1">{selectedProfile.role}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID (user_id)
                  </p>
                  <p className="text-foreground mt-1 font-mono text-xs break-all">
                    {selectedProfile.user_id}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

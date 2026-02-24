import type { ProfileWithCompany } from "@/services/landingAnalyticsService";
import { getAccountType } from "@/services/landingAnalyticsService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

/** Exporta os dados atuais do relatório para PDF (dados filtrados/exibidos). */
export async function exportLandingToPdf(
  profiles: ProfileWithCompany[],
  metrics: { total: number; today: number; thisWeek: number; thisMonth: number; byType: { empresa: number; pessoaFisica: number } }
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  const title = "Landing Page Analytics - TOP-UP";
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Total de cadastros: ${metrics.total} | Hoje: ${metrics.today} | Esta semana: ${metrics.thisWeek} | Este mês: ${metrics.thisMonth}`, 14, 28);
  doc.text(`Origem: Pessoa física: ${metrics.byType.pessoaFisica} | Empresa: ${metrics.byType.empresa}`, 14, 34);
  const headers = ["Nome", "Email", "Tipo", "Data cadastro", "Telefone", "Empresa"];
  const rows = profiles.map((p) => [
    p.name ?? "-",
    p.email,
    getAccountType(p),
    formatDate(p.created_at),
    p.phone ?? "-",
    (p as ProfileWithCompany).company?.name ?? "-",
  ]);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 77, 0] },
  });
  doc.save(`landing-analytics-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

/** Exporta os dados atuais do relatório para Excel (dados filtrados/exibidos). */
export async function exportLandingToExcel(
  profiles: ProfileWithCompany[],
  metrics: { total: number; today: number; thisWeek: number; thisMonth: number; byType: { empresa: number; pessoaFisica: number } }
): Promise<void> {
  const XLSX = await import("xlsx");
  const wsData: (string | number)[][] = [
    ["Landing Page Analytics - TOP-UP"],
    [],
    ["Métricas", ""],
    ["Total de cadastros", metrics.total],
    ["Cadastros hoje", metrics.today],
    ["Cadastros esta semana", metrics.thisWeek],
    ["Cadastros este mês", metrics.thisMonth],
    ["Pessoa física", metrics.byType.pessoaFisica],
    ["Empresa", metrics.byType.empresa],
    [],
    ["Nome", "Email", "Tipo", "Data cadastro", "Telefone", "Empresa"],
    ...profiles.map((p) => [
      p.name ?? "-",
      p.email,
      getAccountType(p),
      formatDate(p.created_at),
      p.phone ?? "-",
      (p as ProfileWithCompany).company?.name ?? "-",
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Landing Analytics");
  XLSX.writeFile(wb, `landing-analytics-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`);
}

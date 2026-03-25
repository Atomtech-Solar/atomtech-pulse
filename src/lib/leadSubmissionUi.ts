import type { Json } from "@/types/supabase";
import type { LeadInterestValue } from "@/constants/leadInterests";

export type LeadPipelineStatus = "new" | "contact" | "converted";

export const LEAD_STATUS_LABEL: Record<LeadPipelineStatus, string> = {
  new: "Novo",
  contact: "Em contato",
  converted: "Atendido",
};

export const INTEREST_LABELS: Record<LeadInterestValue, string> = {
  saber_mais: "Saber mais",
  investir: "Investir",
  avaliar_instalacao: "Avaliar instalação",
  anunciar: "Anunciar",
};

export function interestBadgeClass(type: string): string {
  switch (type) {
    case "investir":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    case "avaliar_instalacao":
      return "bg-blue-500/15 text-blue-300 border-blue-500/40";
    case "anunciar":
      return "bg-purple-500/15 text-purple-300 border-purple-500/40";
    case "saber_mais":
    default:
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/40";
  }
}

export function leadStatusBadgeClass(status: string): string {
  switch (status) {
    case "contact":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "converted":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    case "new":
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/40";
  }
}

function asRecord(data: Json | null): Record<string, unknown> {
  if (data == null || typeof data !== "object" || Array.isArray(data)) return {};
  return data as Record<string, unknown>;
}

/** Cidade aproximada (campo varia por tipo). */
export function extractLeadCity(interestType: string, data: Json | null): string {
  const d = asRecord(data);
  if (interestType === "saber_mais" || interestType === "investir") {
    return String(d.city ?? "");
  }
  if (interestType === "anunciar") return String(d.location ?? "");
  return "";
}

export function extractLeadState(interestType: string, data: Json | null): string {
  if (interestType !== "investir") return "";
  return String(asRecord(data).state ?? "");
}

export function extractInvestmentRange(interestType: string, data: Json | null): string {
  if (interestType !== "investir") return "";
  return String(asRecord(data).investment_range ?? "");
}

export function powerTypeLabel(code: string): string {
  return (
    {
      monofasico: "Monofásico",
      bifasico: "Bifásico",
      trifasico: "Trifásico",
      nao_sei: "Não sei",
    }[code] ?? code
  );
}

export function placeTypeLabel(code: string): string {
  return code === "residencial" ? "Residencial" : code === "comercial" ? "Comercial" : code;
}

export function investmentRangeLabel(code: string): string {
  return (
    {
      ate_10k: "Até R$ 10 mil",
      "10k_50k": "R$ 10 mil – R$ 50 mil",
      "50k_mais": "Acima de R$ 50 mil",
    }[code] ?? code
  );
}

export function boolLabel(v: unknown): string {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  return String(v ?? "—");
}

export function formatDataJsonForDisplay(data: Json | null, interestType: string): string {
  const d = asRecord(data);
  const lines: string[] = [];
  const push = (k: string, label: string) => {
    if (d[k] === undefined || d[k] === null || d[k] === "") return;
    let v = d[k];
    if (k === "investment_range" && typeof v === "string") v = investmentRangeLabel(v);
    if (typeof v === "boolean") v = boolLabel(v);
    lines.push(`${label}: ${String(v)}`);
  };

  switch (interestType) {
    case "saber_mais":
      push("city", "Cidade");
      break;
    case "investir":
      push("city", "Cidade");
      push("state", "Estado");
      push("investment_range", "Faixa de investimento");
      push("has_location", "Possui local");
      push("location_type", "Tipo de local");
      break;
    case "avaliar_instalacao":
      push("address", "Endereço");
      push("place_type", "Tipo de local");
      push("has_parking", "Vaga própria");
      push("power_type", "Rede elétrica");
      push("vehicle_flow", "Fluxo de veículos");
      push("image_url", "Imagem");
      break;
    case "anunciar":
      push("company_name", "Empresa");
      push("business_type", "Tipo de negócio");
      push("location", "Localização");
      push("vehicle_flow", "Fluxo de veículos");
      break;
    default:
      return JSON.stringify(Object.fromEntries(Object.entries(d)));
  }
  return lines.join("\n");
}

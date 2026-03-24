/** Valores persistidos em `lead_submissions.interest_type` e exibidos no formulário de interesse. */
export const LEAD_INTEREST_OPTIONS = [
  { value: "saber_mais", label: "Saber mais" },
  { value: "investir", label: "Investir" },
  { value: "avaliar_ponto", label: "Avaliar ponto de instalação" },
  { value: "anunciar", label: "Anunciar" },
] as const;

export type LeadInterestValue = (typeof LEAD_INTEREST_OPTIONS)[number]["value"];

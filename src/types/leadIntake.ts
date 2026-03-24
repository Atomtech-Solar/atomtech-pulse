import type { LeadInterestValue } from "@/constants/leadInterests";

/** Estado compartilhado (não resetar ao trocar tipo de interesse) */
export type LeadIntakeCommon = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

/** Campos extras por fluxo — chaves internas do formulário (camelCase) */
export type LeadIntakeExtra = {
  /** saber_mais */
  city: string;
  /** investir */
  investCity: string;
  stateUf: string;
  investmentRange: "" | "ate_10k" | "10k_50k" | "50k_mais";
  hasLocation: "" | "sim" | "nao";
  locationTypePlace: string;
  /** avaliar_instalacao */
  fullAddress: string;
  installLocationType: "" | "residencial" | "comercial";
  ownParking: "" | "sim" | "nao";
  electricalNetwork: "" | "monofasico" | "bifasico" | "trifasico" | "nao_sei";
  imageFile: File | null;
  /** anunciar */
  companyName: string;
  businessType: string;
  partnerLocation: string;
  vehicleFlow: "" | "sim" | "nao";
};

export const emptyLeadExtra = (): LeadIntakeExtra => ({
  city: "",
  investCity: "",
  stateUf: "",
  investmentRange: "",
  hasLocation: "",
  locationTypePlace: "",
  fullAddress: "",
  installLocationType: "",
  ownParking: "",
  electricalNetwork: "",
  imageFile: null,
  companyName: "",
  businessType: "",
  partnerLocation: "",
  vehicleFlow: "",
});

/**
 * Contrato JSONB em `lead_submissions.data` (snake_case, tipos estáveis por interest_type).
 * Coluna `interest_type`: saber_mais | investir | avaliar_instalacao | anunciar
 */
export type LeadSubmissionDataSaberMais = {
  city: string;
};

export type LeadSubmissionDataInvestir = {
  city: string;
  state: string;
  investment_range: string;
  has_location: boolean;
  location_type: string;
};

export type LeadSubmissionDataAvaliarInstalacao = {
  address: string;
  place_type: string;
  has_parking: boolean;
  power_type: string;
  image_url: string;
};

export type LeadSubmissionDataAnunciar = {
  company_name: string;
  business_type: string;
  location: string;
  vehicle_flow: boolean;
};

/** Monta `data` para insert no Supabase (apenas chaves com valor definido onde fizer sentido). */
export function buildLeadDataPayload(
  interestType: LeadInterestValue,
  extra: LeadIntakeExtra,
  opts?: { imagePublicUrl?: string | null }
): Record<string, unknown> {
  switch (interestType) {
    case "saber_mais":
      return { city: extra.city.trim() };
    case "investir":
      return {
        city: extra.investCity.trim(),
        state: extra.stateUf.trim(),
        investment_range: extra.investmentRange,
        has_location: extra.hasLocation === "sim",
        location_type: extra.locationTypePlace.trim(),
      };
    case "avaliar_instalacao": {
      const imageUrl =
        opts?.imagePublicUrl != null && opts.imagePublicUrl !== ""
          ? opts.imagePublicUrl
          : "";
      return {
        address: extra.fullAddress.trim(),
        place_type: extra.installLocationType,
        has_parking: extra.ownParking === "sim",
        power_type: extra.electricalNetwork,
        image_url: imageUrl,
      };
    }
    case "anunciar":
      return {
        company_name: extra.companyName.trim(),
        business_type: extra.businessType.trim(),
        location: extra.partnerLocation.trim(),
        vehicle_flow: extra.vehicleFlow === "sim",
      };
    default:
      return {};
  }
}

function strField(data: Record<string, unknown>, k: string): string {
  return typeof data[k] === "string" ? (data[k] as string).trim() : "";
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

/** Valida payload já montado (campos mínimos por tipo). Retorna mensagem de erro ou null. */
export function validateLeadDataPayload(
  interestType: LeadInterestValue,
  data: Record<string, unknown>
): string | null {
  switch (interestType) {
    case "saber_mais":
      if (!strField(data, "city")) return "Informe sua cidade.";
      return null;
    case "investir":
      if (!strField(data, "city")) return "Informe a cidade.";
      if (!strField(data, "state")) return "Selecione o estado (UF).";
      if (!strField(data, "investment_range")) return "Selecione a faixa de investimento.";
      if (!isBool(data.has_location)) return "Indique se já possui local.";
      return null;
    case "avaliar_instalacao":
      if (!strField(data, "address")) return "Informe o endereço completo.";
      if (!strField(data, "place_type")) return "Selecione o tipo de local (residencial ou comercial).";
      if (!isBool(data.has_parking)) return "Indique se possui vaga própria.";
      if (!strField(data, "power_type")) return "Selecione o tipo de rede elétrica.";
      return null;
    case "anunciar":
      if (!strField(data, "company_name")) return "Informe o nome da empresa.";
      if (!strField(data, "business_type")) return "Informe o tipo de negócio.";
      if (!strField(data, "location")) return "Informe a localização.";
      if (!isBool(data.vehicle_flow)) return "Indique se há fluxo relevante de veículos.";
      return null;
    default:
      return "Tipo de interesse inválido.";
  }
}

import type { LeadInterestValue } from "@/constants/leadInterests";

/** Estado compartilhado (não resetar ao trocar tipo de interesse) */
export type LeadIntakeCommon = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

/** Campos extras por fluxo — chaves estáveis para `data` no banco */
export type LeadIntakeExtra = {
  /** saber_mais */
  city: string;
  /** investir */
  investCity: string;
  stateUf: string;
  investmentRange: "" | "ate_10k" | "10k_50k" | "50k_mais";
  hasLocation: "" | "sim" | "nao";
  locationTypePlace: string;
  /** avaliar_ponto */
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

/** Monta o objeto `data` persistido em lead_submissions.data */
export function buildLeadDataPayload(
  interestType: LeadInterestValue,
  extra: LeadIntakeExtra
): Record<string, unknown> {
  switch (interestType) {
    case "saber_mais":
      return { city: extra.city.trim() || undefined };
    case "investir":
      return {
        city: extra.investCity.trim() || undefined,
        state: extra.stateUf.trim() || undefined,
        investment_range: extra.investmentRange || undefined,
        has_location: extra.hasLocation || undefined,
        location_type: extra.locationTypePlace.trim() || undefined,
      };
    case "avaliar_ponto":
      return {
        full_address: extra.fullAddress.trim() || undefined,
        location_kind: extra.installLocationType || undefined,
        own_parking: extra.ownParking || undefined,
        electrical_network: extra.electricalNetwork || undefined,
      };
    case "anunciar":
      return {
        company_name: extra.companyName.trim() || undefined,
        business_type: extra.businessType.trim() || undefined,
        location: extra.partnerLocation.trim() || undefined,
        vehicle_flow: extra.vehicleFlow || undefined,
      };
    default:
      return {};
  }
}

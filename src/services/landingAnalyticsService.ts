import type { Tables } from "@/types/supabase";

export type ProfileRow = Tables<"profiles">;
export type ProfileWithCompany = ProfileRow & {
  company?: { name: string } | null;
};

/** Tipo de cadastro: Empresa (company_admin) ou Pessoa física (demais) */
export function getAccountType(profile: ProfileRow): "Empresa" | "Pessoa física" {
  return profile.role === "company_admin" ? "Empresa" : "Pessoa física";
}

export interface LandingMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: { empresa: number; pessoaFisica: number };
}

export function computeLandingMetrics(profiles: ProfileWithCompany[]): LandingMetrics {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  let empresa = 0;
  let pessoaFisica = 0;

  for (const p of profiles) {
    const createdAt = new Date(p.created_at);
    if (createdAt >= startOfToday) today++;
    if (createdAt >= startOfWeek) thisWeek++;
    if (createdAt >= startOfMonth) thisMonth++;
    if (getAccountType(p) === "Empresa") empresa++;
    else pessoaFisica++;
  }

  return {
    total: profiles.length,
    today,
    thisWeek,
    thisMonth,
    byType: { empresa, pessoaFisica },
  };
}

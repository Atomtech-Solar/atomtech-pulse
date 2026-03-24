import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/types/supabase";
import type { LeadPipelineStatus } from "@/lib/leadSubmissionUi";

export type LeadSubmissionRow = Tables<"lead_submissions">;

export async function fetchLeadSubmissions(options: {
  /** Quando definido, filtra por empresa; super_admin sem filtro pode omitir para listar tudo. */
  companyIdFilter: number | null | "all";
}): Promise<{ data: LeadSubmissionRow[]; error: Error | null }> {
  let q = supabase
    .from("lead_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (options.companyIdFilter !== "all" && options.companyIdFilter != null) {
    q = q.eq("company_id", options.companyIdFilter);
  }

  const { data, error } = await q;
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as LeadSubmissionRow[], error: null };
}

export async function updateLeadStatus(
  id: string,
  leadStatus: LeadPipelineStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("lead_submissions")
    .update({ lead_status: leadStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

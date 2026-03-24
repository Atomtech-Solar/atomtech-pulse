import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLeadSubmissions, updateLeadStatus } from "@/services/leadSubmissionsService";
import type { LeadPipelineStatus } from "@/lib/leadSubmissionUi";

export const LEAD_SUBMISSIONS_QUERY_KEY = "lead_submissions";

export function useLeadSubmissionsScope() {
  const { user, selectedCompanyId } = useAuth();
  return useMemo(() => {
    if (user?.role === "super_admin") {
      if (selectedCompanyId != null) return { companyIdFilter: selectedCompanyId as number };
      return { companyIdFilter: "all" as const };
    }
    return { companyIdFilter: user?.company_id ?? null };
  }, [user, selectedCompanyId]);
}

export function useLeadSubmissions() {
  const { user } = useAuth();
  const scope = useLeadSubmissionsScope();
  const enabled =
    user != null &&
    (user.role === "super_admin" || (user.company_id != null && user.company_id !== undefined));

  return useQuery({
    queryKey: [LEAD_SUBMISSIONS_QUERY_KEY, scope.companyIdFilter],
    queryFn: async () => {
      const res = await fetchLeadSubmissions({
        companyIdFilter: scope.companyIdFilter === "all" ? "all" : scope.companyIdFilter,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadPipelineStatus }) => updateLeadStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LEAD_SUBMISSIONS_QUERY_KEY] });
    },
  });
}

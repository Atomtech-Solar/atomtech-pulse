import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";

type QueryResult<T> = T extends Promise<infer U> ? U : never;

export function useCompanies(options?: UseQueryOptions<Tables<"companies">[]>) {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return data as Tables<"companies">[];
    },
    ...options,
  });
}

export function useStations() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["stations", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("stations").select("*, station_connectors:station_connectors(*)");
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as (Tables<"stations"> & { station_connectors: Tables<"station_connectors">[] })[];
    },
  });
}

export function useSessions() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["sessions", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("v_sessions_list").select("*");
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"v_sessions_list">[];
    },
  });
}

export function useEvUsers() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["ev_users", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("ev_users").select("*");
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"ev_users">[];
    },
  });
}

export function useVouchers() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["vouchers", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("vouchers").select("*");
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"vouchers">[];
    },
  });
}

export function usePushNotifications() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["push_notifications", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("push_notifications").select("*").order("created_at", { ascending: false });
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"push_notifications">[];
    },
  });
}

export function useCompanySettings() {
  const { selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["company_settings", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .single();
      if (error) throw error;
      return data as Tables<"company_settings">;
    },
  });
}

export function useTariffs() {
  const { selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["tariffs", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tariffs")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .order("weekday");
      if (error) throw error;
      return data as Tables<"tariffs">[];
    },
  });
}

export function useStationRevenue() {
  const { user, selectedCompanyId } = useAuth();
  return useQuery({
    queryKey: ["station_revenue", user?.role, selectedCompanyId],
    queryFn: async () => {
      let query = supabase.from("v_station_revenue").select("*");
      if (user?.role === "super_admin" && selectedCompanyId) {
        query = query.eq("company_id", selectedCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"v_station_revenue">[];
    },
  });
}


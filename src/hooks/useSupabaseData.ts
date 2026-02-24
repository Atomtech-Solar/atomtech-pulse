import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  companies,
  stations,
  sessions,
  evUsers,
  vouchers,
  pushNotifications,
  filterByCompany,
} from "@/data/mockData";

const QUERY_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Tempo limite excedido. Tente novamente.")), ms)
    ),
  ]);
}

/** Mock auth = user.id é number. Supabase = user.id é string (uuid). */
function isMockAuth(user: { id?: number | string } | null): boolean {
  return user != null && typeof user.id === "number";
}

export function useCompanies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["companies", user?.id],
    retry: 1,
    queryFn: async () => {
      if (isMockAuth(user)) return companies;
      const promise = supabase.from("companies").select("*").order("name");
      const { data, error } = await withTimeout(promise, QUERY_TIMEOUT_MS);
      if (error) throw error;
      return data as Tables<"companies">[];
    },
  });
}

export function useStations() {
  const { user, selectedCompanyId } = useAuth();
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["stations", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        return filterByCompany(stations, selectedCompanyId, role);
      }
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
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["sessions", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        return filterByCompany(sessions, selectedCompanyId, role);
      }
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
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["ev_users", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        return filterByCompany(evUsers, selectedCompanyId, role);
      }
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
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["vouchers", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        return filterByCompany(vouchers, selectedCompanyId, role);
      }
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
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["push_notifications", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        return filterByCompany(pushNotifications, selectedCompanyId, role);
      }
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
      if (!selectedCompanyId) return null;
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", selectedCompanyId)
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
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("tariffs")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("weekday");
      if (error) throw error;
      return data as Tables<"tariffs">[];
    },
  });
}

/** Perfis para Admin Supremo (Landing Page Analytics). Só habilitado para super_admin. */
export function useProfilesForAdmin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  return useQuery({
    queryKey: ["profiles-admin"],
    enabled: !!isSuperAdmin,
    retry: 1,
    queryFn: async () => {
      const promise = supabase
        .from("profiles")
        .select("*, company:companies(name)")
        .order("created_at", { ascending: false });
      const { data, error } = await withTimeout(promise, QUERY_TIMEOUT_MS);
      if (error) throw error;
      return data as (Tables<"profiles"> & { company: { name: string } | null })[];
    },
  });
}

export function useStationRevenue() {
  const { user, selectedCompanyId } = useAuth();
  const role = user?.role ?? "viewer";
  return useQuery({
    queryKey: ["station_revenue", role, selectedCompanyId],
    queryFn: async () => {
      if (isMockAuth(user)) {
        const filtered = filterByCompany(sessions, selectedCompanyId, role);
        const byStation = new Map<
          string,
          { name: string; city: string; uf: string; total_sessions: number; revenue: number }
        >();
        const stMap = new Map(stations.map((s) => [s.name, s]));
        for (const s of filtered) {
          const st = stMap.get(s.station_name);
          const cur = byStation.get(s.station_name);
          const rev = s.revenue ?? 0;
          if (cur) {
            cur.revenue += rev;
            cur.total_sessions += 1;
          } else {
            byStation.set(s.station_name, {
              name: s.station_name,
              city: st?.city ?? "",
              uf: st?.uf ?? "",
              total_sessions: 1,
              revenue: rev,
            });
          }
        }
        return Array.from(byStation.entries()).map(([name, v], i) => ({
          ...v,
          station_id: i + 1,
          company_id: selectedCompanyId,
        }));
      }
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

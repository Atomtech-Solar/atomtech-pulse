import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORAGE_KEY_THEME } from "@/lib/authStorageKeys";
import { BRAND_SHORT } from "@/constants/branding";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getPageConfig } from "@/config/dashboardHeaderConfig";
import { useIsSidebarDrawer } from "@/hooks/use-mobile";

/** Query keys a refazer por rota (apenas a parte da página atual). */
const REFRESH_QUERY_KEYS_BY_PATH: Record<string, string[]> = {
  "/dashboard": ["sessions", "stations", "ev_users"],
  "/dashboard/sessions": ["sessions"],
  "/dashboard/stations": ["stations-module", "companies"],
  "/dashboard/station": ["station-details", "stations-module", "stations"],
  "/dashboard/users": ["ev_users"],
  "/dashboard/analytics": ["sessions", "stations"],
  "/dashboard/push": ["push_notifications"],
  "/dashboard/vouchers": ["vouchers"],
  "/dashboard/promotions": ["tariffs"],
  "/dashboard/leads": ["lead_submissions"],
  "/dashboard/financial": ["sessions", "stations", "station_revenue"],
  "/dashboard/settings": ["company_settings", "tariffs", "companies"],
  "/dashboard/companies": ["companies"],
  "/admin/companies": ["companies", "profiles-admin"],
  "/admin/landing-analytics": ["profiles-admin"],
  "/admin/leads": ["lead_submissions"],
};
const REFRESH_TIMEOUT_MS = 12000;

export default function DashboardLayout() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user } = useAuth();
  const isSidebarDrawer = useIsSidebarDrawer();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEY_THEME, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY_THEME, "light");
    }
  };

  const handleRefreshData = async () => {
    const pathname = location.pathname;
    const basePath = pathname.startsWith("/dashboard/station/")
      ? "/dashboard/station"
      : pathname.split("/").slice(0, 4).join("/") === "/admin/landing-analytics"
        ? "/admin/landing-analytics"
        : pathname.split("/").slice(0, 3).join("/");
    const queryKeys =
      REFRESH_QUERY_KEYS_BY_PATH[basePath] ?? ["sessions", "stations"];

    // Na página de detalhes da estação, usar a chave exata incluindo stationId
    const stationIdMatch = pathname.match(/^\/dashboard\/station\/([^/]+)$/);
    const stationId = stationIdMatch?.[1];
    const refetchKeys: (string | number)[][] =
      basePath === "/dashboard/station" && stationId
        ? [["station-details", stationId], ...queryKeys.filter((k) => k !== "station-details").map((k) => [k])]
        : queryKeys.map((k) => [k]);

    setIsRefreshing(true);
    try {
      const refetchPromise = Promise.all(
        refetchKeys.map((key) =>
          queryClient.refetchQueries({ queryKey: key })
        )
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), REFRESH_TIMEOUT_MS)
      );
      await Promise.race([refetchPromise, timeoutPromise]);
    } catch {
      // timeout ou erro: para o spinner mesmo assim
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#030712]/85 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar container: fixed on mobile, static on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-3 h-16 border-b border-sidebar-border shrink-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14AB5D] shadow-[0_0_16px_rgba(20,171,93,0.35)]"
            aria-hidden
          >
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight truncate">
            {BRAND_SHORT}
          </span>
          <button
            type="button"
            className="lg:hidden ml-auto p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Sidebar
          userRole={user?.role}
          onNavigate={() => setSidebarOpen(false)}
          className="flex-1 min-h-0"
          isMobileDrawer={isSidebarDrawer}
          pageConfig={isSidebarDrawer ? getPageConfig(location.pathname) : null}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshData}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          isMobileDrawer={isSidebarDrawer}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

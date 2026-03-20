import type { NavigateFunction } from "react-router-dom";

export interface PageConfig {
  title: string;
  breadcrumb: string[];
}

export interface PageAction {
  label: string;
  handler: () => void;
}

const PAGE_CONFIG_BY_PATH: Record<string, PageConfig> = {
  "/dashboard": { title: "Visão Geral", breadcrumb: ["Dashboard"] },
  "/dashboard/sessions": { title: "Sessões", breadcrumb: ["Dashboard", "Operações"] },
  "/dashboard/stations": { title: "Estações", breadcrumb: ["Dashboard", "Operações"] },
  "/dashboard/users": { title: "Usuários", breadcrumb: ["Dashboard", "Operações"] },
  "/dashboard/analytics": { title: "Analytics", breadcrumb: ["Dashboard", "Sistema"] },
  "/dashboard/push": { title: "Push", breadcrumb: ["Dashboard", "Marketing"] },
  "/dashboard/vouchers": { title: "Vouchers", breadcrumb: ["Dashboard", "Marketing"] },
  "/dashboard/promotions": { title: "Promoções", breadcrumb: ["Dashboard", "Marketing"] },
  "/dashboard/financial": { title: "Financeiro", breadcrumb: ["Dashboard", "Financeiro"] },
  "/dashboard/settings": { title: "Configurações", breadcrumb: ["Dashboard", "Sistema"] },
  "/dashboard/companies": { title: "Empresas", breadcrumb: ["Dashboard"] },
  "/admin/companies": { title: "Empresas", breadcrumb: ["Admin"] },
  "/admin/landing-analytics": { title: "Landing Analytics", breadcrumb: ["Admin"] },
};

function getBasePath(pathname: string): string {
  if (pathname.startsWith("/dashboard/station/")) return "/dashboard/station";
  if (pathname === "/admin/landing-analytics") return "/admin/landing-analytics";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 2) return pathname;
  return "/" + parts.slice(0, 3).join("/");
}

export function getPageConfig(pathname: string): PageConfig {
  const base = getBasePath(pathname);
  const exact = PAGE_CONFIG_BY_PATH[pathname] ?? PAGE_CONFIG_BY_PATH[base];
  if (exact) return exact;
  if (pathname.startsWith("/dashboard/station/")) {
    return { title: "Detalhes da Estação", breadcrumb: ["Dashboard", "Operações", "Estações"] };
  }
  return { title: "Dashboard", breadcrumb: ["Dashboard"] };
}

export function getPageActions(
  pathname: string,
  navigate: NavigateFunction
): PageAction[] {
  const base = getBasePath(pathname);
  const actions: PageAction[] = [];

  if (base === "/dashboard/stations") {
    actions.push({
      label: "Nova Estação",
      handler: () =>
        navigate("/dashboard/stations", { state: { openNewDialog: true } }),
    });
  }

  return actions;
}

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  Zap,
  Users,
  BarChart3,
  Bell,
  Ticket,
  Tag,
  DollarSign,
  Building2,
  Settings,
  LineChart,
  Inbox,
} from "lucide-react";

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface MenuGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
  adminOnly?: boolean;
}

export const SIDEBAR_MENU: MenuGroup[] = [
  {
    id: "overview",
    title: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Visão Geral", path: "/dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: "operacoes",
    title: "Operações",
    icon: Activity,
    items: [
      { label: "Sessões", path: "/dashboard/sessions", icon: Activity },
      { label: "Estações", path: "/dashboard/stations", icon: Zap },
      { label: "Usuários", path: "/dashboard/users", icon: Users },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: Bell,
    items: [
      { label: "Leads recebidos", path: "/dashboard/leads", icon: Inbox },
      { label: "Push", path: "/dashboard/push", icon: Bell },
      { label: "Vouchers", path: "/dashboard/vouchers", icon: Ticket },
      { label: "Promoções", path: "/dashboard/promotions", icon: Tag },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { label: "Financeiro", path: "/dashboard/financial", icon: DollarSign },
    ],
  },
  {
    id: "empresas",
    title: "Empresas",
    icon: Building2,
    adminOnly: true,
    items: [
      { label: "Empresas", path: "/admin/companies", icon: Building2 },
      { label: "Landing Analytics", path: "/admin/landing-analytics", icon: LineChart },
      { label: "Leads recebidos", path: "/admin/leads", icon: Inbox },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    icon: Settings,
    items: [
      { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
      { label: "Configurações", path: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const SIDEBAR_STORAGE_KEYS = {
  expandedGroup: "topup_sidebar_expanded_group",
  collapsed: "topup_sidebar_collapsed",
} as const;

export const SIDEBAR_COLLAPSED_WIDTH = 64; // w-16
export const SIDEBAR_EXPANDED_WIDTH = 256;

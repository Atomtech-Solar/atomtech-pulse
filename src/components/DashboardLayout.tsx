import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useSupabaseData";
import {
  LayoutDashboard, Activity, Zap, Users, BarChart3, Bell,
  Ticket, Tag, DollarSign, Building2, Settings, LogOut,
  Menu, X, Sun, Moon, ChevronDown, Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const navItems = [
  { label: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessões', path: '/dashboard/sessions', icon: Activity },
  { label: 'Estações', path: '/dashboard/stations', icon: Zap },
  { label: 'Usuários', path: '/dashboard/users', icon: Users },
  { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Push', path: '/dashboard/push', icon: Bell },
  { label: 'Vouchers', path: '/dashboard/vouchers', icon: Ticket },
  { label: 'Promoções', path: '/dashboard/promotions', icon: Tag },
  { label: 'Financeiro', path: '/dashboard/financial', icon: DollarSign },
  { label: 'Configurações', path: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout, selectedCompanyId, setSelectedCompanyId } = useAuth();
  const { data: companies = [] } = useCompanies();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("topup_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("topup_theme", "light");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const allNavItems = user?.role === 'super_admin'
    ? [...navItems.slice(0, -1), { label: 'Empresas', path: '/admin/companies', icon: Building2 }, navItems[navItems.length - 1]]
    : navItems;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">TOP-UP</span>
          <button className="lg:hidden ml-auto text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allNavItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center gap-4 px-4 lg:px-6 bg-card/50 backdrop-blur-sm shrink-0">
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 bg-secondary border-0 h-9" />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {user?.role === 'super_admin' && (
              <Select value={selectedCompanyId?.toString() ?? 'all'} onValueChange={v => setSelectedCompanyId(v === 'all' ? null : Number(v))}>
                <SelectTrigger className="w-48 h-9 bg-secondary border-0 text-sm">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visão Global</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useSupabaseData";
import { getPageConfig, getPageActions } from "@/config/dashboardHeaderConfig";
import { GlobalSearchCommand } from "./GlobalSearchCommand";
import { UserMenu } from "./UserMenu";
import { CompanyModal } from "./CompanyModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Menu,
  Search,
  Building2,
  RefreshCw,
  Sun,
  Moon,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  /** Quando true (viewport &lt; lg), esconde contexto da página e tema (vão para o menu) */
  isMobileDrawer?: boolean;
}

export function DashboardHeader({
  sidebarOpen,
  setSidebarOpen,
  isRefreshing,
  onRefresh,
  isDark,
  onToggleTheme,
  isMobileDrawer,
}: DashboardHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, selectedCompanyId, setSelectedCompanyId } = useAuth();
  const { data: companies = [] } = useCompanies();

  const [searchOpen, setSearchOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const config = getPageConfig(location.pathname);
  const actions = getPageActions(location.pathname, navigate);

  const showContextInHeader = !isMobileDrawer;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 sm:h-16 border-b border-border flex items-center gap-4 sm:gap-6 px-4 sm:px-5 lg:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        {/* Left: menu + context (context só quando não for mobile drawer) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Abrir menu</TooltipContent>
          </Tooltip>

          {showContextInHeader && (
            <div className="flex flex-col min-w-0">
              <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
                {config.breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                    <span className="truncate">{crumb}</span>
                  </span>
                ))}
              </nav>
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate mt-0.5">
                {config.title}
              </h1>
            </div>
          )}
        </div>

        {/* Center: search trigger */}
        <div className="hidden md:flex flex-1 max-w-md justify-center">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "w-full max-w-sm flex items-center gap-2 rounded-lg border border-transparent",
              "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground",
              "px-3 py-2 text-sm transition-all duration-200"
            )}
          >
            <Search className="w-4 h-4 shrink-0 opacity-60" />
            <span className="flex-1 text-left truncate">Buscar páginas, entidades e ações...</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center rounded border bg-background/80 px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: company + actions + user */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Buscar (⌘K)</TooltipContent>
          </Tooltip>

          {actions.length > 0 && (
            <Button
              size="sm"
              className="h-8 gap-1.5 hidden sm:inline-flex"
              onClick={actions[0].handler}
            >
              <Plus className="w-3.5 h-3.5" />
              {actions[0].label}
            </Button>
          )}

          {user?.role === "super_admin" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                    onClick={() => setCompanyModalOpen(true)}
                    aria-label="Escolher empresa"
                  >
                    <Building2 className="w-4 h-4 text-primary/80" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Contexto global — filtrar por empresa
                </TooltipContent>
              </Tooltip>
              <CompanyModal
                open={companyModalOpen}
                onOpenChange={setCompanyModalOpen}
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelect={(id) => setSelectedCompanyId(id)}
              />
            </>
          )}

          <div className="flex items-center gap-0.5 border-l border-border pl-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200",
                    isRefreshing && "pointer-events-none"
                  )}
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="Atualizar dados"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Atualizar dados</TooltipContent>
            </Tooltip>

            {showContextInHeader && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                    onClick={onToggleTheme}
                    aria-label={isDark ? "Modo claro" : "Modo escuro"}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDark ? "Alternar para modo claro" : "Alternar para modo escuro"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>

      <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </TooltipProvider>
  );
}

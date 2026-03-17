import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SIDEBAR_EXPANDED_WIDTH,
  type MenuGroup,
  type MenuItem,
} from "./menuConfig";
import { ChevronRight, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/useSidebar";
import type { PageConfig } from "@/config/dashboardHeaderConfig";

export interface SidebarProps {
  userRole: string | undefined;
  onNavigate?: () => void;
  className?: string;
  /** Quando true (sidebar em drawer no mobile), mostra no rodapé: contexto da página + tema */
  isMobileDrawer?: boolean;
  pageConfig?: PageConfig | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

function NavItem({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate?: () => void;
}) {
  const ItemIcon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end ?? false}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary rounded-full"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )
      }
    >
      <ItemIcon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function Sidebar({
  userRole,
  onNavigate,
  className,
  isMobileDrawer,
  pageConfig,
  isDark,
  onToggleTheme,
}: SidebarProps) {
  const location = useLocation();
  const { expandedId, toggleGroup, visibleGroups } = useSidebar({ userRole });

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0",
        className
      )}
      style={{
        width: SIDEBAR_EXPANDED_WIDTH,
        minWidth: SIDEBAR_EXPANDED_WIDTH,
      }}
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <div className="flex flex-col gap-0.5 px-3">
          {visibleGroups.map((group) => {
            const isExpanded = expandedId === group.id;
            const isGroupActive = group.items.some((item) => {
              if (item.path === location.pathname) return true;
              if (item.path === "/dashboard") return false;
              return location.pathname.startsWith(item.path + "/");
            });
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex items-center w-full gap-3 rounded-lg py-2 px-3 text-left transition-all duration-200",
                    isGroupActive
                      ? "text-foreground bg-muted/60"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                  aria-expanded={isExpanded}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    {group.title}
                  </span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-0.5 pb-1 pl-4">
                        {group.items.map((item) => (
                          <div key={item.path}>
                            <NavItem item={item} onNavigate={onNavigate} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {isMobileDrawer && pageConfig && (
        <div className="border-t border-sidebar-border p-3 space-y-3 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <nav className="flex items-center gap-1 text-xs text-muted-foreground">
              {pageConfig.breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  )}
                  <span className="truncate">{crumb}</span>
                </span>
              ))}
            </nav>
            <p className="text-sm font-semibold text-foreground truncate mt-0.5">
              {pageConfig.title}
            </p>
          </div>
          {onToggleTheme != null && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={onToggleTheme}
            >
              {isDark ? (
                <Sun className="w-4 h-4 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 shrink-0" />
              )}
              {isDark ? "Modo claro" : "Modo escuro"}
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}

export { SIDEBAR_STORAGE_KEYS } from "./menuConfig";

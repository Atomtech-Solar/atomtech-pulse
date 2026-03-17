import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Zap,
  Users,
  MapPin,
  Bell,
  Ticket,
  Tag,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  LineChart,
} from "lucide-react";

const MOCK_PAGES: { label: string; path: string; icon: React.ElementType }[] = [
  { label: "Visão Geral", path: "/dashboard", icon: LayoutDashboard },
  { label: "Sessões", path: "/dashboard/sessions", icon: Zap },
  { label: "Estações", path: "/dashboard/stations", icon: MapPin },
  { label: "Usuários", path: "/dashboard/users", icon: Users },
  { label: "Push", path: "/dashboard/push", icon: Bell },
  { label: "Vouchers", path: "/dashboard/vouchers", icon: Ticket },
  { label: "Promoções", path: "/dashboard/promotions", icon: Tag },
  { label: "Financeiro", path: "/dashboard/financial", icon: Wallet },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { label: "Configurações", path: "/dashboard/settings", icon: Settings },
  { label: "Empresas (Admin)", path: "/admin/companies", icon: Building2 },
  { label: "Landing Analytics", path: "/admin/landing-analytics", icon: LineChart },
];

export interface GlobalSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchCommand({ open, onOpenChange }: GlobalSearchCommandProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const run = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange]
  );

  useEffect(() => {
    if (!mounted) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [mounted, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, entidades e ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {MOCK_PAGES.map(({ label, path, icon: Icon }) => (
            <CommandItem
              key={path}
              value={`${label} ${path}`}
              onSelect={() => run(path)}
            >
              <Icon className="mr-2 h-4 w-4 opacity-60" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Entidades (mock)">
          <CommandItem
            value="estação estações"
            onSelect={() => run("/dashboard/stations")}
          >
            <MapPin className="mr-2 h-4 w-4 opacity-60" />
            Estações
          </CommandItem>
          <CommandItem value="usuário usuários" onSelect={() => run("/dashboard/users")}>
            <Users className="mr-2 h-4 w-4 opacity-60" />
            Usuários
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

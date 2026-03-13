import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/cadastro", "/politica-de-privacidade", "/app"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AuthInit({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { loadUserFromStorage, isLoading } = useAuth();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Rotas públicas: mostra conteúdo imediatamente (login/landing), auth roda em background
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

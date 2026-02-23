import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";

/**
 * Protege rotas /dashboard/* - requer company_id ou super_admin.
 * Se autenticado mas sem company_id (e não super_admin), mostra bloqueio.
 */
export default function DashboardProtectedRoute() {
  const { user, isAuthenticated, isLoading, isBlocked, logout } = useAuth();

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-4 p-8 bg-card border border-border rounded-2xl shadow-xl text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Acesso bloqueado
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Usuário não vinculado a nenhuma empresa.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

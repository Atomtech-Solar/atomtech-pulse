import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthInit({ children }: { children: ReactNode }) {
  const { loadUserFromStorage, isLoading } = useAuth();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

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

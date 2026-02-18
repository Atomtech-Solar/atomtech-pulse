import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tables, Enums } from "@/types/supabase";

export type Role = Enums<"user_role">;

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  company_id: number | null;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

type ProfileRow = Tables<"profiles">;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single<ProfileRow>();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.warn("Erro ao carregar profile do usuário", error);
    return null;
  }

  return {
    id: data.user_id,
    email: data.email,
    role: data.role,
    company_id: data.company_id,
    name: data.name ?? data.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    const stored = localStorage.getItem("atomtech_company");
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Inicializa sessão + profile (com timeout para nunca travar em "Carregando...")
  useEffect(() => {
    let mounted = true;
    let loadingStopped = false;

    const stopLoading = () => {
      if (!loadingStopped && mounted) {
        loadingStopped = true;
        setLoading(false);
      }
    };

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.user && mounted) {
          const profile = await loadProfile(session.user.id);
          if (profile && mounted) {
            setUser(profile);
            if (profile.role !== "super_admin" && profile.company_id != null) {
              setSelectedCompanyId(profile.company_id);
            }
          }
        }
      } catch {
        // Ignora erro (rede, etc.) e segue para liberar a tela
      } finally {
        stopLoading();
      }
    };

    init();

    // Se getSession ou loadProfile travar, libera a tela após 6s
    const fallback = setTimeout(stopLoading, 6000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setSelectedCompanyId(null);
        return;
      }
      const profile = await loadProfile(session.user.id);
      if (profile) {
        setUser(profile);
        if (profile.role !== "super_admin" && profile.company_id != null) {
          setSelectedCompanyId(profile.company_id);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedCompanyId !== null) localStorage.setItem("atomtech_company", String(selectedCompanyId));
    else localStorage.removeItem("atomtech_company");
  }, [selectedCompanyId]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      return "Email ou senha inválidos";
    }

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      return "Perfil de usuário não encontrado. Contate o administrador.";
    }

    setUser(profile);
    if (profile.role !== "super_admin" && profile.company_id != null) {
      setSelectedCompanyId(profile.company_id);
    }
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedCompanyId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedCompanyId,
        setSelectedCompanyId,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


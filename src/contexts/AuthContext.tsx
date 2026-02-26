import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  isSupabaseAuthError,
  onSessionInvalid,
} from "@/lib/supabaseAuthUtils";

const STORAGE_KEY = "topup_user";
const COMPANY_KEY = "topup_company";

export type Role = "super_admin" | "company_admin" | "manager" | "viewer";

export interface AuthUser {
  id: number | string;
  email: string;
  role: Role;
  company_id: number | null;
  name: string;
}

export type RedirectPath = "/admin/companies" | "/dashboard" | null;

export function getRedirectPath(user: AuthUser | null): RedirectPath {
  if (!user) return null;
  if (user.role === "super_admin") return "/admin/companies";
  if (user.company_id != null) return "/dashboard";
  return null;
}

/** true = autenticado mas sem company_id e não é super_admin */
export function isBlockedUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return false;
  return user.company_id == null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBlocked: boolean;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  login: (email: string, password: string) => string | null;
  loginWithSupabase: (email: string, password: string) => Promise<{ error?: string; redirectPath?: RedirectPath }>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  setUserFromSupabase: (session: Session) => Promise<AuthUser | null>;
}

const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 1,
    email: "admin@topup.com",
    password: "123456",
    role: "super_admin",
    company_id: null,
    name: "Admin TOP-UP",
  },
  {
    id: 2,
    email: "empresa@topup.com",
    password: "123456",
    role: "company_admin",
    company_id: 1,
    name: "João Silva",
  },
  {
    id: 3,
    email: "manager@topup.com",
    password: "123456",
    role: "manager",
    company_id: 1,
    name: "Maria Santos",
  },
  {
    id: 4,
    email: "viewer@topup.com",
    password: "123456",
    role: "viewer",
    company_id: 1,
    name: "Carlos Viewer",
  },
];

function parseStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("id" in parsed) ||
      !("email" in parsed) ||
      !("role" in parsed)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const u = parsed as Record<string, unknown>;
    const id = typeof u.id === "string" ? u.id : Number(u.id);
    return {
      id,
      email: String(u.email),
      role: u.role as Role,
      company_id: u.company_id != null ? Number(u.company_id) : null,
      name: String(u.name ?? u.email),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function parseStoredCompany(): number | null {
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    localStorage.removeItem(COMPANY_KEY);
    return null;
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COMPANY_KEY);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMEOUT_MS = 15000;
const SESSION_LOAD_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

async function fetchProfileFromSession(userId: string): Promise<AuthUser | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, email, name, role, company_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (isSupabaseAuthError(error)) {
      throw error;
    }
    return null;
  }
  if (!profile) return null;

  return {
    id: profile.user_id,
    email: profile.email,
    role: profile.role as Role,
    company_id: profile.company_id,
    name: profile.name ?? profile.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initRan = useRef(false);
  const loginJustCompletedRef = useRef(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    () => parseStoredCompany()
  );

  const applyAuthUser = useCallback((authUser: AuthUser | null) => {
    setUser(authUser);
    if (authUser?.company_id != null) {
      setSelectedCompanyId(authUser.company_id);
      localStorage.setItem(COMPANY_KEY, String(authUser.company_id));
    } else {
      setSelectedCompanyId(null);
      localStorage.removeItem(COMPANY_KEY);
    }
    if (authUser && authUser.role !== "super_admin") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } else if (!authUser) {
      clearAuthStorage();
    }
  }, []);

  const loadProfileAndApply = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const authUser = await fetchProfileFromSession(userId);
        if (authUser) {
          applyAuthUser(authUser);
          return true;
        }
      } catch (err) {
        if (isSupabaseAuthError(err)) {
          console.warn("[Auth] Erro de autenticação ao buscar perfil:", err);
          return false;
        }
      }
      return false;
    },
    [applyAuthUser]
  );

  const forceLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    clearAuthStorage();
    setUser(null);
    setSelectedCompanyId(null);
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    clearAuthStorage();
    setUser(null);
    setSelectedCompanyId(null);
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    const unsubSessionInvalid = onSessionInvalid(() => {
      forceLogout();
    });
    return unsubSessionInvalid;
  }, [forceLogout]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          clearAuthStorage();
          setUser(null);
          setSelectedCompanyId(null);
          return;
        }

        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            if (loginJustCompletedRef.current) {
              loginJustCompletedRef.current = false;
              return;
            }
          }

          if (session?.user) {
            try {
              const ok = await loadProfileAndApply(session.user.id);
              if (!ok) {
                await forceLogout();
              }
            } catch {
              await forceLogout();
            }
          } else {
            clearAuthStorage();
            setUser(null);
            setSelectedCompanyId(null);
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [loadProfileAndApply, forceLogout]);

  const loadUserFromStorage = useCallback(async () => {
    if (initRan.current) return;
    initRan.current = true;

    const timeoutId = setTimeout(() => setIsLoading(false), SESSION_LOAD_TIMEOUT_MS);

    try {
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        SESSION_LOAD_TIMEOUT_MS,
        "Timeout ao recuperar sessão."
      );

      clearTimeout(timeoutId);

      if (sessionError) {
        console.warn("[Auth] Erro ao obter sessão:", sessionError);
        clearAuthStorage();
        setUser(null);
        setSelectedCompanyId(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        try {
          const ok = await loadProfileAndApply(session.user.id);
          if (!ok) {
            await forceLogout();
          }
        } catch {
          await forceLogout();
        }
        if (import.meta.env.DEV) {
          console.log("[Auth] Sessão restaurada:", session.user.email);
        }
      } else {
        setUser(null);
        setSelectedCompanyId(null);
        const stored = parseStoredUser();
        if (stored) {
          setUser(stored);
          const company = parseStoredCompany();
          if (company !== null) setSelectedCompanyId(company);
        } else {
          clearAuthStorage();
        }
      }
    } catch (err) {
      console.error("[Auth] loadUserFromStorage error:", err);
      clearTimeout(timeoutId);
      setUser(null);
      setSelectedCompanyId(null);
      const stored = parseStoredUser();
      if (stored) {
        setUser(stored);
        const company = parseStoredCompany();
        if (company !== null) setSelectedCompanyId(company);
      } else {
        clearAuthStorage();
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadProfileAndApply, forceLogout]);

  const login = useCallback((email: string, password: string): string | null => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return "Email ou senha inválidos";
    const { password: _, ...userData } = found;
    applyAuthUser(userData);
    setIsLoading(false);
    if (import.meta.env.DEV) {
      console.log("[Auth] login success (mock)", userData.email);
    }
    return null;
  }, [applyAuthUser]);

  const setUserFromSupabase = useCallback(
    async (session: Session): Promise<AuthUser | null> => {
      try {
        const authUser = await fetchProfileFromSession(session.user.id);
        if (authUser) {
          applyAuthUser(authUser);
          return authUser;
        }
      } catch {
        /* ignore */
      }
      return null;
    },
    [applyAuthUser]
  );

  const loginWithSupabase = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; redirectPath?: RedirectPath }> => {
      const applyUserAndReturn = (authUser: AuthUser) => {
        applyAuthUser(authUser);
        return { redirectPath: getRedirectPath(authUser) };
      };

      try {
        const signInPromise = supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        const { data, error: signInError } = await withTimeout(
          signInPromise,
          LOGIN_TIMEOUT_MS,
          "Tempo limite excedido. Verifique sua conexão e tente novamente."
        );

        if (signInError) {
          const msg =
            signInError.message === "Invalid login credentials"
              ? "Email ou senha inválidos"
              : signInError.message;
          return { error: msg };
        }
        if (!data.session?.user)
          return { error: "Erro ao autenticar. Tente novamente." };

        const profilePromise = supabase
          .from("profiles")
          .select("user_id, email, name, role, company_id")
          .eq("user_id", data.session.user.id)
          .single();
        const { data: profile, error: profileError } = await withTimeout(
          (async () => {
            const res = await profilePromise;
            return { data: res.data, error: res.error };
          })(),
          LOGIN_TIMEOUT_MS,
          "Tempo limite excedido ao buscar perfil. Tente novamente."
        );

        if (profileError || !profile) {
          const msg = profileError?.message
            ? `Perfil: ${profileError.message}`
            : "Perfil não encontrado. Entre em contato com o suporte.";
          return { error: msg };
        }

        loginJustCompletedRef.current = true;

        const authUser: AuthUser = {
          id: profile.user_id,
          email: profile.email,
          role: profile.role as Role,
          company_id: profile.company_id,
          name: profile.name ?? profile.email,
        };
        applyAuthUser(authUser);
        return { redirectPath: getRedirectPath(authUser) };
      } catch (err) {
        console.error("[Auth] loginWithSupabase error:", err);
        const isDev = import.meta.env.DEV;
        if (isDev) {
          const fallback = MOCK_USERS.find(
            (u) =>
              u.email === email.trim().toLowerCase() && u.password === password
          );
          if (fallback) {
            const { password: _, ...userData } = fallback;
            return applyUserAndReturn(userData);
          }
        }
        return {
          error:
            err instanceof Error
              ? err.message
              : "Erro inesperado. Tente novamente.",
        };
      }
    },
    [applyAuthUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isBlocked: isBlockedUser(user),
        selectedCompanyId,
        setSelectedCompanyId,
        login,
        loginWithSupabase,
        logout,
        loadUserFromStorage,
        setUserFromSupabase,
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

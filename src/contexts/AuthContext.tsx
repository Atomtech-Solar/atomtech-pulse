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
import { supabase, SUPABASE_AUTH_STORAGE_KEY } from "@/lib/supabaseClient";
import {
  isSupabaseAuthError,
  logPermissionError,
  onSessionInvalid,
} from "@/lib/supabaseAuthUtils";

const STORAGE_KEY = "topup_user";
const COMPANY_KEY = "topup_company";
const PENDING_COMPANY_KEY = "pending_company_signup";

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
  /** true = checagem inicial de sessão concluída; queries Supabase só devem rodar quando true */
  isSessionReady: boolean;
  isBlocked: boolean;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  login: (email: string, password: string) => string | null;
  loginWithSupabase: (email: string, password: string) => Promise<{ error?: string; redirectPath?: RedirectPath }>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  setUserFromSupabase: (session: Session) => Promise<AuthUser | null>;
  /** Define true quando o cadastro foi concluído e o modal de boas-vindas está pendente. Evita redirect automático. */
  setRegistrationSuccessPending: (value: boolean) => void;
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

/** Encerra sessão só no cliente (rápido). O signOut global pode travar em rede lenta e impedir o redirect. */
const SIGN_OUT_TIMEOUT_MS = 5000;

async function signOutLocalWithTimeout(): Promise<void> {
  try {
    await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise<void>((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS)),
    ]);
  } catch {
    /* ignore */
  }
}

/** Garante remoção de tokens Supabase se signOut falhar ou ficar incompleto. */
function clearSupabaseLocalSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("sb-") && k.includes("auth-token")) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Navegação pós-logout: em `/login` o replace para a mesma URL costuma não recarregar — força query única. */
function redirectToLoginAfterLogout(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path === "/login") {
    window.location.replace(`/login?logout=${Date.now()}`);
  } else {
    window.location.replace("/login");
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMEOUT_MS = 15000;
/** Timeout curto para getSession - sessões stale causam refresh lento (segundos). */
const SESSION_CHECK_TIMEOUT_MS = 500;
/** Timeout para buscar perfil do usuário (evita loading infinito em /dashboard após F5). */
const PROFILE_TIMEOUT_MS = 12000;

const AUTH_LOG = {
  start: (msg: string) => import.meta.env.DEV && console.log(`[Auth] ${msg}`),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[Auth] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[Auth] ${msg}`, ...args),
  /** Logs críticos (sessão inexistente, refresh, falhas) - sempre ativos para debug em produção */
  auth: (msg: string, data?: Record<string, unknown>) =>
    (data ? console.info(`[Auth] ${msg}`, data) : console.info(`[Auth] ${msg}`)),
};

/** Verifica se existe alguma sessão Supabase em localStorage (evita getSession lento quando vazio). */
function hasStoredSupabaseSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const custom = localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom) as { access_token?: string };
      return !!parsed?.access_token;
    }
    // Fallback: chave padrão sb-*-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.includes("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { access_token?: string };
          return !!parsed?.access_token;
        }
        return false;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

async function fetchProfileFromSession(userId: string): Promise<AuthUser | null> {
  const { data: profile, error } = await withTimeout(
    supabase
      .from("profiles")
      .select("user_id, email, name, role, company_id")
      .eq("user_id", userId)
      .single(),
    PROFILE_TIMEOUT_MS,
    "Tempo limite excedido ao carregar perfil. Tente novamente."
  );

  if (error) {
    if (isSupabaseAuthError(error)) {
      logPermissionError("fetchProfileFromSession (profiles)", error);
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
  const registrationSuccessPendingRef = useRef(false);
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
        let authUser = await fetchProfileFromSession(userId);
        if (authUser) {
          // company_admin sem company_id: completar cadastro pendente (confirmação de email)
          if (
            authUser.role === "company_admin" &&
            authUser.company_id == null &&
            typeof window !== "undefined"
          ) {
            try {
              const key = `${PENDING_COMPANY_KEY}_${authUser.email}`;
              const raw = localStorage.getItem(key);
              if (raw) {
                const pending = JSON.parse(raw) as {
                  companyName?: string;
                  cnpj?: string;
                  userName?: string;
                  phone?: string | null;
                };
                const { error: rpcError } = await supabase.rpc(
                  "create_company_for_signup",
                  {
                    p_company_name: pending.companyName ?? "",
                    p_cnpj: pending.cnpj ?? "",
                    p_user_email: authUser.email,
                    p_user_name: pending.userName ?? authUser.name,
                    p_phone: pending.phone ?? null,
                  }
                );
                if (!rpcError) {
                  localStorage.removeItem(key);
                  authUser = await fetchProfileFromSession(userId);
                  if (authUser) {
                    applyAuthUser(authUser);
                    return true;
                  }
                }
              }
            } catch {
              /* ignore */
            }
          }
          applyAuthUser(authUser);
          return true;
        }
      } catch (err) {
        if (isSupabaseAuthError(err)) {
          AUTH_LOG.auth("Falha de autenticação ao buscar perfil", {
            error: err instanceof Error ? err.message : String(err),
          });
          return false;
        }
      }
      return false;
    },
    [applyAuthUser]
  );

  const forceLogout = useCallback(async () => {
    await signOutLocalWithTimeout();
    clearSupabaseLocalSession();
    clearAuthStorage();
    setUser(null);
    setSelectedCompanyId(null);
    redirectToLoginAfterLogout();
  }, []);

  const logout = useCallback(async () => {
    await signOutLocalWithTimeout();
    clearSupabaseLocalSession();
    clearAuthStorage();
    setUser(null);
    setSelectedCompanyId(null);
    redirectToLoginAfterLogout();
  }, []);

  useEffect(() => {
    const unsubSessionInvalid = onSessionInvalid(() => {
      forceLogout();
    });
    return unsubSessionInvalid;
  }, [forceLogout]);

  // Refresh de sessão: (1) ao retornar à aba, (2) a cada 50s quando ativo (evita token expirado após ~1 min de inatividade)
  useEffect(() => {
    const doRefresh = () => {
      if (!user) return;
      supabase.auth
        .refreshSession()
        .then(({ error }) => {
          if (error) AUTH_LOG.auth("Refresh token falhou", { error: error.message });
        })
        .catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") doRefresh();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(doRefresh, 50 * 1000); // 50 segundos
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        AUTH_LOG.auth(`onAuthStateChange: ${event}`, { hasSession: !!session?.user });

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
          // Durante cadastro: não aplicar usuário nem redirecionar – deixa o modal aparecer na tela de cadastro
          if (registrationSuccessPendingRef.current) {
            return;
          }
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            if (loginJustCompletedRef.current) {
              loginJustCompletedRef.current = false;
              return;
            }
          }

      if (session?.user) {
        try {
          const ok = await loadProfileAndApply(session.user.id);
          if (!ok && !registrationSuccessPendingRef.current) {
            await forceLogout();
          }
        } catch (err) {
          if (!registrationSuccessPendingRef.current) {
            logPermissionError("onAuthStateChange loadProfile", err);
            await forceLogout();
          }
        }
      } else {
        // Sessão nula (expirada/logout) → limpar tudo. Não restaurar de localStorage.
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

    const t0 = performance.now();

    try {
      // Fast path: sem sessão Supabase em localStorage → skip getSession (evita 50-100ms+ em navegadores normais)
      if (!hasStoredSupabaseSession()) {
        AUTH_LOG.auth("Sessão inexistente (storage vazio) → skip getSession");
        clearAuthStorage();
        setUser(null);
        setSelectedCompanyId(null);
        setIsLoading(false);
        return;
      }

      type SessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise: Promise<SessionResult> = new Promise((resolve) =>
        setTimeout(() => {
          AUTH_LOG.auth("getSession timeout - sessão stale, limpando", {
            timeoutMs: SESSION_CHECK_TIMEOUT_MS,
          });
          resolve({ data: { session: null }, error: null } as SessionResult);
        }, SESSION_CHECK_TIMEOUT_MS)
      );

      const {
        data: { session },
        error: sessionError,
      } = await Promise.race([sessionPromise, timeoutPromise]);

      const elapsed = Math.round(performance.now() - t0);
      AUTH_LOG.start(`getSession em ${elapsed}ms, session=${!!session}`);

      if (sessionError) {
        AUTH_LOG.auth("Falha ao obter sessão", { error: String(sessionError?.message ?? sessionError) });
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
        clearAuthStorage();
        setUser(null);
        setSelectedCompanyId(null);
        return;
      }

      if (session?.user) {
        try {
          const ok = await loadProfileAndApply(session.user.id);
          if (!ok) {
            await forceLogout();
          }
        } catch (err) {
          logPermissionError("loadUserFromStorage loadProfile", err);
          await forceLogout();
        }
        AUTH_LOG.auth("Sessão restaurada", { email: session.user.email });
      } else {
        // Timeout ou sessão nula → limpar storage Supabase (evita delay no próximo acesso)
        AUTH_LOG.auth("Sessão inexistente ou expirada → limpando storage");
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
        clearAuthStorage();
        setUser(null);
        setSelectedCompanyId(null);
      }
    } catch (err) {
      AUTH_LOG.error("loadUserFromStorage error:", err);
      logPermissionError("loadUserFromStorage", err);
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      clearAuthStorage();
      setUser(null);
      setSelectedCompanyId(null);
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
        AUTH_LOG.start("loginWithSupabase iniciando...");
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

        let authUser: AuthUser = {
          id: profile.user_id,
          email: profile.email,
          role: profile.role as Role,
          company_id: profile.company_id,
          name: profile.name ?? profile.email,
        };

        // company_admin sem company_id: completar cadastro pendente
        if (
          authUser.role === "company_admin" &&
          authUser.company_id == null &&
          typeof window !== "undefined"
        ) {
          try {
            const key = `${PENDING_COMPANY_KEY}_${authUser.email}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              const pending = JSON.parse(raw) as {
                companyName?: string;
                cnpj?: string;
                userName?: string;
                phone?: string | null;
              };
              const { error: rpcError } = await supabase.rpc(
                "create_company_for_signup",
                {
                  p_company_name: pending.companyName ?? "",
                  p_cnpj: pending.cnpj ?? "",
                  p_user_email: authUser.email,
                  p_user_name: pending.userName ?? authUser.name,
                  p_phone: pending.phone ?? null,
                }
              );
              if (!rpcError) {
                localStorage.removeItem(key);
                const { data: updatedProfile } = await supabase
                  .from("profiles")
                  .select("user_id, email, name, role, company_id")
                  .eq("user_id", data.session.user.id)
                  .single();
                if (updatedProfile) {
                  authUser = {
                    id: updatedProfile.user_id,
                    email: updatedProfile.email,
                    role: updatedProfile.role as Role,
                    company_id: updatedProfile.company_id,
                    name: updatedProfile.name ?? updatedProfile.email,
                  };
                }
              }
            }
          } catch {
            /* ignore */
          }
        }

        loginJustCompletedRef.current = true;
        applyAuthUser(authUser);
        AUTH_LOG.start("loginWithSupabase concluído com sucesso");
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

  const setRegistrationSuccessPending = useCallback((value: boolean) => {
    registrationSuccessPendingRef.current = value;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSessionReady: !isLoading,
        isBlocked: isBlockedUser(user),
        selectedCompanyId,
        setSelectedCompanyId,
        login,
        loginWithSupabase,
        logout,
        loadUserFromStorage,
        setUserFromSupabase,
        setRegistrationSuccessPending,
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

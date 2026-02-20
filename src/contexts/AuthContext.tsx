import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

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

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  loadUserFromStorage: () => void;
  setUserFromSupabase: (session: Session) => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initRan = useRef(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    () => parseStoredCompany()
  );

  const loadUserFromStorage = useCallback(async () => {
    if (initRan.current) return;
    initRan.current = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, email, name, role, company_id")
          .eq("user_id", session.user.id)
          .single();
        if (profile) {
          const authUser: AuthUser = {
            id: profile.user_id,
            email: profile.email,
            role: profile.role as Role,
            company_id: profile.company_id,
            name: profile.name ?? profile.email,
          };
          setUser(authUser);
          if (profile.company_id != null) {
            setSelectedCompanyId(profile.company_id);
            localStorage.setItem(COMPANY_KEY, String(profile.company_id));
          }
          setIsLoading(false);
          if (typeof window !== "undefined" && import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[Auth] Supabase session restored", authUser.email);
          }
          return;
        }
      }
    } catch {
      // Supabase indisponível ou erro - fallback para mock
    }
    const stored = parseStoredUser();
    setUser(stored);
    const company = parseStoredCompany();
    if (company !== null) setSelectedCompanyId(company);
    setIsLoading(false);
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Auth] loadUserFromStorage", stored ? "user restored (mock)" : "no user");
    }
  }, []);

  const login = useCallback((email: string, password: string): string | null => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return "Email ou senha inválidos";
    const { password: _, ...userData } = found;
    setUser(userData);
    if (userData.role !== "super_admin" && userData.company_id != null) {
      setSelectedCompanyId(userData.company_id);
      localStorage.setItem(COMPANY_KEY, String(userData.company_id));
    } else {
      localStorage.removeItem(COMPANY_KEY);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setIsLoading(false);
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Auth] login success", userData.email, "-> redirect /");
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPANY_KEY);
    setUser(null);
    setSelectedCompanyId(null);
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Auth] logout -> redirect /login");
    }
  }, []);

  const setUserFromSupabase = useCallback(async (session: Session) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, email, name, role, company_id")
      .eq("user_id", session.user.id)
      .single();
    if (profile) {
      const authUser: AuthUser = {
        id: profile.user_id,
        email: profile.email,
        role: profile.role as Role,
        company_id: profile.company_id,
        name: profile.name ?? profile.email,
      };
      setUser(authUser);
      if (profile.company_id != null) {
        setSelectedCompanyId(profile.company_id);
        localStorage.setItem(COMPANY_KEY, String(profile.company_id));
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        selectedCompanyId,
        setSelectedCompanyId,
        login,
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

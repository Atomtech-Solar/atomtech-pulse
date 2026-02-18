import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'super_admin' | 'company_admin' | 'manager' | 'viewer';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  company_id: number | null;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const mockUsers = [
  { id: 1, email: "admin@atomtech.com", password: "123456", role: "super_admin" as Role, company_id: null, name: "Admin Atomtech" },
  { id: 2, email: "empresa@cliente.com", password: "123456", role: "company_admin" as Role, company_id: 1, name: "João Silva" },
  { id: 3, email: "manager@cliente.com", password: "123456", role: "manager" as Role, company_id: 1, name: "Maria Santos" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('atomtech_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    const stored = localStorage.getItem('atomtech_company');
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('atomtech_user', JSON.stringify(user));
    else localStorage.removeItem('atomtech_user');
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId !== null) localStorage.setItem('atomtech_company', String(selectedCompanyId));
    else localStorage.removeItem('atomtech_company');
  }, [selectedCompanyId]);

  const login = (email: string, password: string): string | null => {
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (!found) return 'Email ou senha inválidos';
    const { password: _, ...userData } = found;
    setUser(userData);
    if (userData.role !== 'super_admin') setSelectedCompanyId(userData.company_id);
    return null;
  };

  const logout = () => {
    setUser(null);
    setSelectedCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, selectedCompanyId, setSelectedCompanyId, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

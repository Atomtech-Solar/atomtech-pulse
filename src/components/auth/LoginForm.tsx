import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getRedirectPath, isBlockedUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Eye, EyeOff, AlertTriangle, LogOut } from "lucide-react";

type LoginFormProps = {
  embedded?: boolean;
  onSwitchToRegister?: () => void;
};

export function LoginForm({ embedded, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loginWithSupabase, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const redirectPath = getRedirectPath(user);
  const isBlocked = isBlockedUser(user);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isBlocked) return;
    if (isAuthenticated && redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, isAuthenticated, isBlocked, redirectPath, navigate]);

  if (isAuthenticated && isBlocked) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/85 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/25">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">Acesso bloqueado</h2>
        <p className="mb-6 text-sm text-[#a1a1aa]">Usuário não vinculado a nenhuma empresa.</p>
        <Button
          variant="outline"
          className="w-full border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: loginError, redirectPath: path } = await loginWithSupabase(email, password);
      if (loginError) {
        setError(loginError);
        return;
      }
      if (path) {
        navigate(path, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#14AB5D]/30 to-transparent"
        aria-hidden
      />

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-[#14AB5D] shadow-[0_0_28px_rgba(20,171,93,0.45)]">
          <Zap className="h-7 w-7 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">Entrar</h2>
        <p className="mt-1.5 text-sm text-[#a1a1aa]">Acesse sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[#a1a1aa]">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-xl border-white/10 bg-[#141414] text-white placeholder:text-zinc-500 focus-visible:border-[#14AB5D]/40 focus-visible:ring-[#14AB5D]/25"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-[#a1a1aa]">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-xl border-white/10 bg-[#141414] pr-10 text-white placeholder:text-zinc-500 focus-visible:border-[#14AB5D]/40 focus-visible:ring-[#14AB5D]/25"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] transition-colors hover:text-[#14AB5D]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="ghost"
          className="hero-btn-primary h-11 w-full rounded-xl border-2 border-transparent font-semibold text-white hover:text-white"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      {embedded && onSwitchToRegister ? (
        <p className="mt-7 text-center text-sm text-[#a1a1aa]">
          Não tem conta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-[#14AB5D] transition-colors hover:text-[#4ade80] hover:underline"
          >
            Cadastrar
          </button>
        </p>
      ) : null}
    </div>
  );
}

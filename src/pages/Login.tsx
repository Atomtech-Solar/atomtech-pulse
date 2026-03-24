import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, getRedirectPath, isBlockedUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Eye, EyeOff, AlertTriangle, LogOut, ArrowLeft } from "lucide-react";

function LoginBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(20, 171, 93, 0.14), transparent 55%), radial-gradient(ellipse 70% 45% at 100% 50%, rgba(20, 171, 93, 0.06), transparent 50%), #030712",
        }}
      />
      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#14AB5D]/12 blur-[100px]" />
      <div className="absolute -bottom-40 -right-16 h-96 w-96 rounded-full bg-[#14AB5D]/10 blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0)_0%,#030712_100%)] opacity-90" />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loginWithSupabase, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const redirectPath = getRedirectPath(user);

  useEffect(() => {
    if (!searchParams.has("logout")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("logout");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const isBlocked = isBlockedUser(user);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isBlocked) return;
    if (isAuthenticated && redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, isAuthenticated, isBlocked, redirectPath, navigate]);

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

  if (isAuthenticated && isBlocked) {
    return (
      <div className="landing-auth relative min-h-screen w-full overflow-hidden bg-[#030712] text-white">
        <LoginBackground />
        <Link
          to="/"
          className="absolute left-4 top-4 z-20 flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-[#14AB5D]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à landing
        </Link>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a]/85 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/25">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="mb-2 text-lg font-semibold text-white">Acesso bloqueado</h1>
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
        </div>
      </div>
    );
  }

  return (
    <div className="landing-auth relative min-h-screen w-full overflow-hidden bg-[#030712] text-white">
      <LoginBackground />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#14AB5D]/30 border-t-[#14AB5D]" />
            <p className="text-sm text-[#a1a1aa]">Entrando...</p>
          </div>
        </div>
      )}

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm text-[#a1a1aa] backdrop-blur-md transition-colors hover:border-[#14AB5D]/30 hover:text-[#14AB5D]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à landing
      </Link>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16 sm:py-20">
        <div className="animate-fade-in w-full max-w-[420px] px-1 sm:px-0">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-9">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#14AB5D]/30 to-transparent"
              aria-hidden
            />

            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-[#14AB5D] shadow-[0_0_28px_rgba(20,171,93,0.45)]">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
                TOP-UP
              </h1>
              <p className="mt-1.5 text-sm text-[#a1a1aa]">Gestão de carregadores veiculares</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#a1a1aa]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-[#141414] text-white placeholder:text-zinc-500 focus-visible:border-[#14AB5D]/40 focus-visible:ring-[#14AB5D]/25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#a1a1aa]">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-white/10 bg-[#141414] pr-10 text-white placeholder:text-zinc-500 focus-visible:border-[#14AB5D]/40 focus-visible:ring-[#14AB5D]/25"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-[#14AB5D]"
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

            <p className="mt-7 text-center text-sm text-[#a1a1aa]">
              Não tem conta?{" "}
              <Link to="/#auth" className="font-medium text-[#14AB5D] transition-colors hover:text-[#4ade80] hover:underline">
                Cadastrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

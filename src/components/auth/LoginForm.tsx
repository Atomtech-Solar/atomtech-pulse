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
      <div className="rounded-2xl p-8 bg-card border border-border shadow-xl text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Acesso bloqueado</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Usuário não vinculado a nenhuma empresa.
        </p>
        <Button variant="outline" className="w-full" onClick={() => logout()}>
          <LogOut className="w-4 h-4 mr-2" />
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
    <div className="rounded-2xl p-6 sm:p-8 bg-card border border-border shadow-xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 glow-primary">
          <Zap className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">
          Entrar
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acesse sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 font-semibold gradient-primary text-primary-foreground glow-primary"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      {embedded && onSwitchToRegister ? (
        <p className="text-sm text-muted-foreground text-center mt-6">
          Não tem conta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary hover:underline font-medium"
          >
            Cadastrar
          </button>
        </p>
      ) : null}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function Register() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUserFromSupabase, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedCompany = companyName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedCompany) {
      setError("Nome da empresa é obrigatório");
      setLoading(false);
      return;
    }
    if (!trimmedEmail) {
      setError("Email é obrigatório");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { company_name: trimmedCompany, name: trimmedCompany },
        },
      });

      if (signUpError) {
        setError(signUpError.message === "User already registered" ? "Este email já está cadastrado. Faça login." : signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      const { error: rpcError } = await supabase.rpc("create_company_for_signup", {
        p_company_name: trimmedCompany,
        p_user_email: trimmedEmail,
        p_user_name: trimmedCompany,
      });

      if (rpcError) {
        setError(
          rpcError.message.includes("function") || rpcError.message.includes("does not exist")
            ? "Configure a migration do Supabase (create_company_for_signup). Veja supabase/migrations/"
            : rpcError.message
        );
        setLoading(false);
        return;
      }

      if (authData.session) {
        await setUserFromSupabase(authData.session);
        navigate("/app", { replace: true });
      } else {
        setError("Conta criada! Verifique seu email para confirmar e faça login.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
              Criar conta
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comece a gerenciar sua rede de carregadores
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="company">Nome da empresa</Label>
              <Input
                id="company"
                type="text"
                placeholder="Minha Empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

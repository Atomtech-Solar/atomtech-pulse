import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRedirectPath } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, User, Building2, Phone } from "lucide-react";
import {
  validateCnpj,
  stripCnpj,
  formatCnpj,
} from "@/lib/validateCnpj";
import { formatPhoneNational, getPhoneDigits, validatePhoneBR } from "@/lib/formatPhone";

type AccountType = "user" | "company";

export default function Register() {
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const { user, setUserFromSupabase, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const path = getRedirectPath(user);
      navigate(path ?? "/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptedPrivacyPolicy) {
      setError("Você precisa aceitar a Política de Privacidade para continuar.");
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedCompany = companyName.trim();

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

    if (accountType === "user") {
      if (!trimmedName) {
        setError("Nome é obrigatório");
        setLoading(false);
        return;
      }
      const phoneDigits = getPhoneDigits(phone);
      if (phoneDigits.length > 0) {
        const phoneValidation = validatePhoneBR(phoneDigits);
        if (!phoneValidation.valid) {
          setError(phoneValidation.error ?? "Telefone inválido");
          setLoading(false);
          return;
        }
      }
    } else {
      if (!trimmedCompany) {
        setError("Nome da empresa é obrigatório");
        setLoading(false);
        return;
      }
      const cnpjValidation = validateCnpj(cnpj);
      if (!cnpjValidation.valid) {
        setError(cnpjValidation.error ?? "CNPJ inválido");
        setLoading(false);
        return;
      }
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: accountType === "user" ? trimmedName : trimmedCompany,
            company_name: accountType === "company" ? trimmedCompany : undefined,
            phone: accountType === "user" && getPhoneDigits(phone).length >= 10 ? `+55${getPhoneDigits(phone)}` : undefined,
          },
        },
      });

      if (signUpError) {
        let message = signUpError.message;
        if (signUpError.message === "User already registered") {
          message = "Este email já está cadastrado. Faça login.";
        } else if (signUpError.message.toLowerCase().includes("email rate limit") || signUpError.message.toLowerCase().includes("rate limit exceeded")) {
          message = "Limite de tentativas excedido. Aguarde cerca de 1 hora ou desative a confirmação de email no Supabase (Auth → Providers → Email → desmarque 'Confirm email') para desenvolvimento.";
        }
        setError(message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      // Sem sessão (ex.: confirmação de email ativa), não é possível escrever em tabelas com RLS.
      // Nesse caso, encerra o fluxo aqui e pede confirmação/login.
      if (!authData.session) {
        setError("Conta criada! Verifique seu email para confirmar e faça login.");
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      const displayName =
        accountType === "user" ? trimmedName : trimmedCompany;

      if (accountType === "user") {
        const phoneValue = getPhoneDigits(phone).length >= 10 ? `+55${getPhoneDigits(phone)}` : null;
        const { error: profileError } = await upsertProfile({
          user_id: userId,
          email: trimmedEmail,
          name: displayName,
          role: "viewer",
          company_id: null,
          phone: phoneValue,
        });
        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }
      } else {
        const cnpjDigits = stripCnpj(cnpj);
        const rpc = supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>
        ) => Promise<{ error: { message: string } | null }>;
        const { error: rpcError } = await rpc(
          "create_company_for_signup",
          {
            p_company_name: trimmedCompany,
            p_cnpj: cnpjDigits,
            p_user_email: trimmedEmail,
            p_user_name: displayName,
          }
        );

        if (rpcError) {
          setError(
            rpcError.message.includes("function") ||
            rpcError.message.includes("does not exist")
              ? "Função de cadastro de empresa não encontrada no Supabase. Aplique a migration create_company_for_signup."
              : rpcError.message
          );
          setLoading(false);
          return;
        }
      }

      const authUser = await setUserFromSupabase(authData.session);
      const path = authUser ? getRedirectPath(authUser) : null;
      navigate(path ?? "/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  async function upsertProfile(params: {
    user_id: string;
    email: string;
    name: string;
    role: "viewer" | "company_admin";
    company_id: number | null;
    phone?: string | null;
  }) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", params.user_id)
      .maybeSingle();

    const profileData = {
      name: params.name,
      role: params.role,
      company_id: params.company_id,
      ...(params.phone != null && { phone: params.phone }),
    };

    if (existing) {
      return supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", params.user_id);
    }

    return supabase.from("profiles").insert({
      user_id: params.user_id,
      email: params.email,
      name: params.name,
      role: params.role,
      company_id: params.company_id,
      ...(params.phone != null && { phone: params.phone }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[600px]">
        <div className="w-full max-w-[600px] mt-10 mb-10 mx-0 bg-card border border-border rounded-2xl p-8 shadow-xl">
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

          <div className="mb-6">
            <Label className="mb-3 block">Tipo de conta</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountType("user")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  accountType === "user"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <User className="w-4 h-4" />
                Usuário
              </button>
              <button
                type="button"
                onClick={() => setAccountType("company")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  accountType === "company"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Empresa
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {accountType === "user" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={accountType === "user"}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="61 9 9999-9999"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setPhone(formatPhoneNational(digits));
                      }}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Nome da empresa</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Minha Empresa Ltda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={accountType === "company"}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                      setCnpj(digits.length === 14 ? formatCnpj(digits) : digits);
                    }}
                    required={accountType === "company"}
                    className="h-11"
                  />
                </div>
              </>
            )}

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
              disabled={!acceptedPrivacyPolicy || loading}
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

          <div className="mt-6 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                id="privacy-policy"
                checked={acceptedPrivacyPolicy}
                onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked === true)}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Ao criar sua conta, você declara que leu, compreendeu e concorda com a{" "}
                <Link
                  to="/politica-de-privacidade"
                  className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity inline"
                >
                  Política de Privacidade e Proteção de Dados (LGPD)
                </Link>
                {" "}da Atom Tech / Top-Up, autorizando o tratamento de seus dados conforme descrito no documento.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

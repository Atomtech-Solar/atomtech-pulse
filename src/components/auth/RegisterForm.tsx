import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRedirectPath } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RegistrationSuccessModal } from "@/components/RegistrationSuccessModal";
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

const SIGNUP_TIMEOUT_MS = 25000;

type AccountType = "user" | "company";

const USER_INTERESTS = [
  { value: "saber_mais", label: "Saber mais" },
  { value: "investir", label: "Investir" },
  { value: "avaliar_ponto", label: "Avaliar ponto de instalação para carregador" },
  { value: "anunciar", label: "Anunciar" },
] as const;

type RegisterFormProps = {
  embedded?: boolean;
  onSwitchToLogin?: () => void;
};

export function RegisterForm({ embedded, onSwitchToLogin }: RegisterFormProps) {
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [interest, setInterest] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const registrationSuccessPendingRef = useRef(false);
  const { user, isAuthenticated, isLoading, logout, setRegistrationSuccessPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (registrationSuccessPendingRef.current) return;
    if (!isLoading && isAuthenticated) {
      const path = getRedirectPath(user);
      navigate(path ?? (embedded ? "/" : "/login"), { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate, embedded]);

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
      setRegistrationSuccessPending(true);
      registrationSuccessPendingRef.current = true;

      const displayName = accountType === "user" ? trimmedName : trimmedCompany;
      const phoneValue =
        accountType === "user" && getPhoneDigits(phone).length >= 10
          ? `+55${getPhoneDigits(phone)}`
          : null;
      const cnpjDigits = accountType === "company" ? stripCnpj(cnpj) : null;

      let success = false;

      const invokePromise = supabase.functions.invoke<{ success: boolean; error?: { code?: string; message?: string } }>("create-user", {
        body: {
          email: trimmedEmail,
          password,
          name: displayName,
          accountType,
          phone: phoneValue,
          companyName: accountType === "company" ? trimmedCompany : null,
          cnpj: cnpjDigits,
          interest: accountType === "user" && interest ? interest : undefined,
        },
      });

      const timeoutPromise = new Promise<typeof invokePromise>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), SIGNUP_TIMEOUT_MS)
      );

      const result = await Promise.race([invokePromise, timeoutPromise]).catch((err) => ({
        data: null,
        error: err?.message === "TIMEOUT" ? new Error("TIMEOUT") : err,
      }));

      if (!result.error && result.data) {
        const res = result.data as { success?: boolean; error?: { code?: string; message?: string } };
        if (res?.success) {
          success = true;
        } else {
          const code = res?.error?.code;
          if (code === "EMAIL_ALREADY_EXISTS") {
            setError("Este email já está cadastrado. Faça login.");
            setRegistrationSuccessPending(false);
            registrationSuccessPendingRef.current = false;
            return;
          }
          if (code === "INVALID_PASSWORD") {
            setError("A senha não atende aos requisitos mínimos.");
            setRegistrationSuccessPending(false);
            registrationSuccessPendingRef.current = false;
            return;
          }
        }
      }

      if (success) {
        await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: displayName,
              company_name: accountType === "company" ? trimmedCompany : undefined,
              phone: phoneValue ?? undefined,
              interest: accountType === "user" && interest ? interest : undefined,
            },
          },
        });

        if (signUpError) {
          setRegistrationSuccessPending(false);
          registrationSuccessPendingRef.current = false;
          if (
            signUpError.message?.toLowerCase().includes("already registered") ||
            signUpError.message?.toLowerCase().includes("already exists")
          ) {
            setError("Este email já está cadastrado. Faça login.");
          } else if (signUpError.message?.toLowerCase().includes("rate limit")) {
            setError("Limite de tentativas excedido. Aguarde alguns minutos.");
          } else {
            setError(signUpError.message ?? "Não foi possível criar a conta. Tente novamente.");
          }
          return;
        }

        if (!authData?.user) {
          setRegistrationSuccessPending(false);
          registrationSuccessPendingRef.current = false;
          setError("Erro ao criar conta. Tente novamente.");
          return;
        }

        if (authData.session && accountType === "company") {
          const { error: rpcError } = await supabase.rpc("create_company_for_signup", {
            p_company_name: trimmedCompany,
            p_cnpj: cnpjDigits,
            p_user_email: trimmedEmail,
            p_user_name: displayName,
            p_phone: phoneValue,
          });
          if (rpcError) {
            setRegistrationSuccessPending(false);
            registrationSuccessPendingRef.current = false;
            setError(rpcError.message ?? "Erro ao vincular empresa.");
            return;
          }
        }

        if (!authData.session && accountType === "company") {
          try {
            localStorage.setItem(
              `pending_company_signup_${trimmedEmail}`,
              JSON.stringify({ companyName: trimmedCompany, cnpj: cnpjDigits, userName: displayName, phone: phoneValue })
            );
          } catch {
            /* ignore */
          }
        }
      }

      setShowSuccessModal(true);
    } catch (err) {
      setRegistrationSuccessPending(false);
      registrationSuccessPendingRef.current = false;
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = async () => {
    registrationSuccessPendingRef.current = false;
    setRegistrationSuccessPending(false);
    setShowSuccessModal(false);
    await logout();
  };

  return (
    <>
      <div className="rounded-2xl p-6 sm:p-10 bg-card border border-border shadow-xl w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">
            Criar conta
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comece a gerenciar sua rede de carregadores
          </p>
        </div>

        <div className="mb-6">
          <Label className="mb-3 block">Tipo de conta</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAccountType("user")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border text-sm font-medium transition-colors ${
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
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border text-sm font-medium transition-colors ${
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
              <div className="space-y-3">
                <Label className="block">Interesse</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {USER_INTERESTS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="interest"
                        value={opt.value}
                        checked={interest === opt.value}
                        onChange={() => setInterest(opt.value)}
                        className="w-4 h-4 text-primary border-border"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={accountType === "user"}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-phone"
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
                <Label htmlFor="reg-company">Nome da empresa</Label>
                <Input
                  id="reg-company"
                  type="text"
                  placeholder="Minha Empresa Ltda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={accountType === "company"}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-cnpj">CNPJ</Label>
                <Input
                  id="reg-cnpj"
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
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Senha</Label>
            <Input
              id="reg-password"
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

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                id="reg-privacy-policy"
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
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Entrar
            </button>
          ) : (
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          )}
        </p>
      </div>

      <RegistrationSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </>
  );
}

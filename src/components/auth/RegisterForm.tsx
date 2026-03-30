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
import { Zap, Phone } from "lucide-react";
import { formatPhoneNational, getPhoneDigits, validatePhoneBR } from "@/lib/formatPhone";

const SIGNUP_TIMEOUT_MS = 25000;

type RegisterFormProps = {
  embedded?: boolean;
  onSwitchToLogin?: () => void;
  /** Quando false, UI somente leitura (card inativo no desktop). */
  interactive?: boolean;
  /** Sem moldura de card (uso dentro do painel da landing / wrapper com borda). */
  plainChrome?: boolean;
};

export function RegisterForm({ embedded, onSwitchToLogin, interactive = true, plainChrome = false }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
    if (!interactive) return;
    setError("");

    if (!acceptedPrivacyPolicy) {
      setError("Você precisa aceitar a Política de Privacidade para continuar.");
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

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
    if (!trimmedName) {
      setError("Nome é obrigatório");
      setLoading(false);
      return;
    }
    const phoneDigits = getPhoneDigits(phone);
    if (phoneDigits.length < 10) {
      setError("Informe um telefone válido com DDD.");
      setLoading(false);
      return;
    }
    const phoneValidation = validatePhoneBR(phoneDigits);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error ?? "Telefone inválido");
      setLoading(false);
      return;
    }

    try {
      setRegistrationSuccessPending(true);
      registrationSuccessPendingRef.current = true;

      const phoneValue = `+55${phoneDigits}`;

      let success = false;

      const invokePromise = supabase.functions.invoke<{ success: boolean; error?: { code?: string; message?: string } }>("create-user", {
        body: {
          email: trimmedEmail,
          password,
          name: trimmedName,
          accountType: "user" as const,
          phone: phoneValue,
          companyName: null,
          cnpj: null,
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
              name: trimmedName,
              phone: phoneValue,
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

  const ro = !interactive;

  return (
    <>
      <div
        className={
          plainChrome
            ? "w-full"
            : "w-full rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-10"
        }
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Criar conta</h2>
          <p className="mt-1 text-sm text-muted-foreground">Acesse o painel e acompanhe sua operação em tempo real</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Nome</Label>
            <Input
              id="reg-name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={interactive}
              disabled={ro}
              className="h-11"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={interactive}
              disabled={ro}
              className="h-11"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-phone"
                type="tel"
                placeholder="61 9 9999-9999"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setPhone(formatPhoneNational(digits));
                }}
                required={interactive}
                disabled={ro}
                className="h-11 pl-10"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Senha</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={interactive}
              disabled={ro}
              minLength={6}
              className="h-11"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="group flex cursor-pointer items-start gap-3">
              <Checkbox
                id="reg-privacy-policy"
                checked={acceptedPrivacyPolicy}
                onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked === true)}
                disabled={ro}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm leading-relaxed text-muted-foreground">
                Ao criar sua conta, você declara que leu, compreendeu e concorda com a{" "}
                <Link
                  to="/politica-de-privacidade"
                  className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                  onClick={(e) => ro && e.preventDefault()}
                >
                  Política de Privacidade e Proteção de Dados (LGPD)
                </Link>{" "}
                da Atom Tech / Luma Generation, autorizando o tratamento de seus dados conforme descrito no documento.
              </span>
            </label>
          </div>

          <Button type="submit" className="h-11 w-full font-semibold" disabled={ro || !acceptedPrivacyPolicy || loading}>
            {loading ? "Cadastrando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          {onSwitchToLogin ? (
            <button type="button" onClick={onSwitchToLogin} disabled={ro} className="font-medium text-primary hover:underline disabled:pointer-events-none">
              Entrar
            </button>
          ) : (
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          )}
        </p>
      </div>

      <RegistrationSuccessModal open={showSuccessModal} onOpenChange={setShowSuccessModal} onClose={handleSuccessModalClose} />
    </>
  );
}

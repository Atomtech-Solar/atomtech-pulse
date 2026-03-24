import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatPhoneNational, getPhoneDigits, validatePhoneBR } from "@/lib/formatPhone";
import type { LeadInterestValue } from "@/constants/leadInterests";
import { buildLeadDataPayload, emptyLeadExtra, type LeadIntakeExtra } from "@/types/leadIntake";
import { InterestSelector } from "./InterestSelector";
import { BasicForm } from "./BasicForm";
import { InvestForm } from "./InvestForm";
import { InstallForm } from "./InstallForm";
import { AdvertiseForm } from "./AdvertiseForm";
import { leadInputClass, leadTextareaClass } from "./leadFormStyles";
import { cn } from "@/lib/utils";

const HINT: Record<LeadInterestValue, string> = {
  saber_mais: "Leva menos de 10 segundos — preencha apenas o essencial.",
  investir: "Pré-qualificação comercial: quanto mais claro, mais rápido retornamos.",
  avaliar_ponto: "Quanto mais detalhes, melhor podemos te ajudar no projeto.",
  anunciar: "Parcerias e mídia — conte sobre seu negócio e sua região.",
};

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function validateForm(
  interestType: LeadInterestValue,
  name: string,
  phoneDigits: string,
  email: string,
  extra: LeadIntakeExtra
): string | null {
  if (!name.trim()) return "Informe seu nome.";
  if (phoneDigits.length < 10) return "Informe um telefone válido com DDD.";
  const ph = validatePhoneBR(phoneDigits);
  if (!ph.valid) return ph.error ?? "Telefone inválido.";

  const em = email.trim();
  if (em && !em.includes("@")) return "E-mail inválido.";
  if (interestType !== "saber_mais" && !em) return "E-mail é obrigatório para este tipo de interesse.";

  switch (interestType) {
    case "saber_mais":
      if (!extra.city.trim()) return "Informe sua cidade.";
      return null;
    case "investir":
      if (!extra.investCity.trim()) return "Informe a cidade.";
      if (!extra.stateUf) return "Selecione o estado (UF).";
      if (!extra.investmentRange) return "Selecione a faixa de investimento.";
      if (!extra.hasLocation) return "Indique se já possui local.";
      return null;
    case "avaliar_ponto":
      if (!extra.fullAddress.trim()) return "Informe o endereço completo.";
      if (!extra.installLocationType) return "Selecione o tipo de local (residencial ou comercial).";
      if (!extra.ownParking) return "Indique se possui vaga própria.";
      if (!extra.electricalNetwork) return "Selecione o tipo de rede elétrica.";
      return null;
    case "anunciar":
      if (!extra.companyName.trim()) return "Informe o nome da empresa.";
      if (!extra.businessType.trim()) return "Informe o tipo de negócio.";
      if (!extra.partnerLocation.trim()) return "Informe a localização.";
      if (!extra.vehicleFlow) return "Indique se há fluxo relevante de veículos.";
      return null;
    default:
      return null;
  }
}

type InterestFormContainerProps = {
  interactive?: boolean;
  onSuccess?: () => void;
};

export function InterestFormContainer({ interactive = true, onSuccess }: InterestFormContainerProps) {
  const [interestType, setInterestType] = useState<LeadInterestValue>("saber_mais");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [extra, setExtra] = useState<LeadIntakeExtra>(() => emptyLeadExtra());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const patchExtra = useCallback((patch: Partial<LeadIntakeExtra>) => {
    setExtra((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactive) return;
    setError("");

    const digits = getPhoneDigits(phone);
    const err = validateForm(interestType, name, digits, email, extra);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      const phoneE164 = `+55${digits}`;

      let dataPayload: Record<string, unknown> = { ...buildLeadDataPayload(interestType, extra) };

      if (interestType === "avaliar_ponto" && extra.imageFile) {
        const path = `public/${crypto.randomUUID()}-${safeFileName(extra.imageFile.name)}`;
        const { error: upErr } = await supabase.storage.from("lead-attachments").upload(path, extra.imageFile, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) {
          setError(upErr.message ?? "Falha no envio da imagem. Tente outra foto ou envie sem imagem.");
          setLoading(false);
          return;
        }
        dataPayload = { ...dataPayload, image_path: path };
      }

      const trimmedEmail = email.trim().toLowerCase();
      const { error: insertError } = await supabase.from("lead_submissions").insert({
        name: name.trim(),
        phone: phoneE164,
        email: trimmedEmail || null,
        interest_type: interestType,
        message: message.trim() || null,
        data: dataPayload,
      });

      if (insertError) {
        setError(insertError.message ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const ro = !interactive;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InterestSelector value={interestType} onChange={setInterestType} disabled={ro} />

      <p className="text-xs leading-relaxed text-[#a1a1aa] transition-opacity duration-300">{HINT[interestType]}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="int-name">Nome</Label>
          <Input
            id="int-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={ro}
            className={leadInputClass}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="int-phone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="int-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(formatPhoneNational(d));
              }}
              disabled={ro}
              className={cn(leadInputClass, "pl-10")}
              autoComplete="tel"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="int-email">
            E-mail{" "}
            {interestType === "saber_mais" ? (
              <span className="font-normal text-muted-foreground">(opcional)</span>
            ) : null}
          </Label>
          <Input
            id="int-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={ro}
            className={leadInputClass}
            autoComplete="email"
          />
        </div>
      </div>

      <div key={interestType} className="transition-all duration-300 ease-in-out">
        {interestType === "saber_mais" && <BasicForm disabled={ro} extra={extra} onExtraChange={patchExtra} />}
        {interestType === "investir" && <InvestForm disabled={ro} extra={extra} onExtraChange={patchExtra} />}
        {interestType === "avaliar_ponto" && <InstallForm disabled={ro} extra={extra} onExtraChange={patchExtra} />}
        {interestType === "anunciar" && <AdvertiseForm disabled={ro} extra={extra} onExtraChange={patchExtra} />}
      </div>

      <div className="space-y-2">
        <Label htmlFor="int-message">
          Mensagem <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="int-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={ro}
          placeholder="Algo mais que devemos saber?"
          className={leadTextareaClass}
          rows={3}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="h-11 w-full font-semibold" disabled={ro || loading}>
        {loading ? (
          "Enviando..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Enviar interesse
          </>
        )}
      </Button>
    </form>
  );
}

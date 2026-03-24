import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { InterestFormContainer } from "@/components/lead/InterestFormContainer";
import { cn } from "@/lib/utils";

type LeadFormProps = {
  /** Quando false, formulário só exibe estado visual (clique no card pai ativa o modo). */
  interactive?: boolean;
};

export function LeadForm({ interactive = true }: LeadFormProps) {
  const [success, setSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (success && interactive) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="mb-3 h-14 w-14 text-[#14AB5D]" />
        <h3 className="font-display text-lg font-semibold text-foreground">Recebemos seu contato</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Em breve nossa equipe retorna pelo telefone ou e-mail informado.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSuccess(false);
            setFormKey((k) => k + 1);
          }}
        >
          Enviar outro interesse
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(!interactive && "min-h-[200px]")}>
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Formulário de interesse
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha sua intenção — os campos se adaptam para qualificar melhor seu pedido.
        </p>
      </div>

      <InterestFormContainer key={formKey} interactive={interactive} onSuccess={() => setSuccess(true)} />
    </div>
  );
}

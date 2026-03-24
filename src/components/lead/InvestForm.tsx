import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LeadIntakeExtra } from "@/types/leadIntake";
import { BR_UFS } from "@/constants/brStates";
import { leadInputClass, leadSelectClass } from "./leadFormStyles";
import { cn } from "@/lib/utils";

type InvestFormProps = {
  disabled?: boolean;
  extra: LeadIntakeExtra;
  onExtraChange: (patch: Partial<LeadIntakeExtra>) => void;
};

const RANGE_OPTIONS: { value: LeadIntakeExtra["investmentRange"]; label: string }[] = [
  { value: "ate_10k", label: "Até R$ 10 mil" },
  { value: "10k_50k", label: "R$ 10 mil – R$ 50 mil" },
  { value: "50k_mais", label: "Acima de R$ 50 mil" },
];

export function InvestForm({ disabled, extra, onExtraChange }: InvestFormProps) {
  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <p className="text-xs text-emerald-400/90">
        Quanto mais detalhes, melhor podemos te ajudar na proposta.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inv-city">Cidade</Label>
          <Input
            id="inv-city"
            value={extra.investCity}
            onChange={(e) => onExtraChange({ investCity: e.target.value })}
            disabled={disabled}
            className={leadInputClass}
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-uf">Estado (UF)</Label>
          <select
            id="inv-uf"
            value={extra.stateUf}
            onChange={(e) => onExtraChange({ stateUf: e.target.value })}
            disabled={disabled}
            className={cn(leadSelectClass, "w-full")}
          >
            <option value="">Selecione</option>
            {BR_UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Faixa de investimento</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RANGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-emerald-500/60 has-[:checked]:bg-emerald-500/10",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <input
                type="radio"
                name="inv-range"
                checked={extra.investmentRange === opt.value}
                onChange={() => onExtraChange({ investmentRange: opt.value })}
                disabled={disabled}
                className="h-4 w-4 border-border text-emerald-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Possui local?</Label>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["sim", "Sim"],
              ["nao", "Não"],
            ] as const
          ).map(([k, lab]) => (
            <label
              key={k}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm has-[:checked]:border-emerald-500/60 has-[:checked]:bg-emerald-500/10",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <input
                type="radio"
                name="inv-loc"
                checked={extra.hasLocation === k}
                onChange={() => onExtraChange({ hasLocation: k })}
                disabled={disabled}
                className="h-4 w-4 border-border text-emerald-500"
              />
              {lab}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-place-type">Tipo de local</Label>
        <Input
          id="inv-place-type"
          value={extra.locationTypePlace}
          onChange={(e) => onExtraChange({ locationTypePlace: e.target.value })}
          disabled={disabled}
          placeholder="Ex.: posto, shopping, estacionamento, condomínio…"
          className={leadInputClass}
        />
      </div>

    </div>
  );
}

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LeadIntakeExtra } from "@/types/leadIntake";
import { leadInputClass } from "./leadFormStyles";
import { cn } from "@/lib/utils";

type AdvertiseFormProps = {
  disabled?: boolean;
  extra: LeadIntakeExtra;
  onExtraChange: (patch: Partial<LeadIntakeExtra>) => void;
};

export function AdvertiseForm({ disabled, extra, onExtraChange }: AdvertiseFormProps) {
  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <p className="text-xs text-emerald-400/90">
        Parcerias e mídia — conte um pouco sobre o seu negócio.
      </p>

      <div className="space-y-2">
        <Label htmlFor="adv-company">Nome da empresa</Label>
        <Input
          id="adv-company"
          value={extra.companyName}
          onChange={(e) => onExtraChange({ companyName: e.target.value })}
          disabled={disabled}
          className={leadInputClass}
          placeholder="Razão social ou marca"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adv-biz">Tipo de negócio</Label>
        <Input
          id="adv-biz"
          value={extra.businessType}
          onChange={(e) => onExtraChange({ businessType: e.target.value })}
          disabled={disabled}
          className={leadInputClass}
          placeholder="Ex.: rede de postos, shopping, frota…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adv-loc">Localização</Label>
        <Input
          id="adv-loc"
          value={extra.partnerLocation}
          onChange={(e) => onExtraChange({ partnerLocation: e.target.value })}
          disabled={disabled}
          className={leadInputClass}
          placeholder="Cidade / região de atuação"
        />
      </div>

      <div className="space-y-2">
        <Label>Possui fluxo relevante de veículos?</Label>
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
                name="adv-flow"
                checked={extra.vehicleFlow === k}
                onChange={() => onExtraChange({ vehicleFlow: k })}
                disabled={disabled}
                className="h-4 w-4 border-border text-emerald-500"
              />
              {lab}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

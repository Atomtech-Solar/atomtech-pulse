import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LeadIntakeExtra } from "@/types/leadIntake";
import { leadInputClass } from "./leadFormStyles";

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
    </div>
  );
}

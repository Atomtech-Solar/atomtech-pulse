import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LeadIntakeExtra } from "@/types/leadIntake";
import { leadInputClass } from "./leadFormStyles";

type BasicFormProps = {
  disabled?: boolean;
  extra: LeadIntakeExtra;
  onExtraChange: (patch: Partial<LeadIntakeExtra>) => void;
};

export function BasicForm({ disabled, extra, onExtraChange }: BasicFormProps) {
  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <p className="text-xs text-emerald-400/90">Leva menos de 10 segundos — preencha só o essencial.</p>
      <div className="space-y-2">
        <Label htmlFor="lead-city">Cidade</Label>
        <Input
          id="lead-city"
          value={extra.city}
          onChange={(e) => onExtraChange({ city: e.target.value })}
          disabled={disabled}
          placeholder="Onde você está?"
          className={leadInputClass}
        />
      </div>
    </div>
  );
}

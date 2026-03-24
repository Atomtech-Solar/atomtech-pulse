import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LeadIntakeExtra } from "@/types/leadIntake";
import { leadInputClass, leadTextareaClass } from "./leadFormStyles";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";

type InstallFormProps = {
  disabled?: boolean;
  extra: LeadIntakeExtra;
  onExtraChange: (patch: Partial<LeadIntakeExtra>) => void;
};

const NET_OPTIONS: { value: LeadIntakeExtra["electricalNetwork"]; label: string }[] = [
  { value: "monofasico", label: "Monofásico" },
  { value: "bifasico", label: "Bifásico" },
  { value: "trifasico", label: "Trifásico" },
  { value: "nao_sei", label: "Não sei" },
];

export function InstallForm({ disabled, extra, onExtraChange }: InstallFormProps) {
  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <p className="text-xs text-emerald-400/90">
        Quanto mais detalhes, melhor podemos te ajudar — fotos reduzem retrabalho técnico.
      </p>

      <div className="space-y-2">
        <Label htmlFor="ins-address">Endereço completo</Label>
        <Textarea
          id="ins-address"
          value={extra.fullAddress}
          onChange={(e) => onExtraChange({ fullAddress: e.target.value })}
          disabled={disabled}
          placeholder="Rua, número, bairro, cidade, CEP"
          className={leadTextareaClass}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de local</Label>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["residencial", "Residencial"],
              ["comercial", "Comercial"],
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
                name="ins-loc-type"
                checked={extra.installLocationType === k}
                onChange={() => onExtraChange({ installLocationType: k })}
                disabled={disabled}
                className="h-4 w-4 border-border text-emerald-500"
              />
              {lab}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Possui vaga própria?</Label>
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
                name="ins-parking"
                checked={extra.ownParking === k}
                onChange={() => onExtraChange({ ownParking: k })}
                disabled={disabled}
                className="h-4 w-4 border-border text-emerald-500"
              />
              {lab}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de rede elétrica</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NET_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2 py-2 text-xs sm:text-sm has-[:checked]:border-emerald-500/60 has-[:checked]:bg-emerald-500/10",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <input
                type="radio"
                name="ins-net"
                checked={extra.electricalNetwork === opt.value}
                onChange={() => onExtraChange({ electricalNetwork: opt.value })}
                disabled={disabled}
                className="h-4 w-4 shrink-0 border-border text-emerald-500"
              />
              <span className="leading-tight">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ins-photo">Foto do local (opcional, recomendado)</Label>
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 px-4 py-6 transition-colors hover:border-emerald-500/40",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-center text-xs text-muted-foreground">
            {extra.imageFile ? extra.imageFile.name : "PNG, JPG ou WebP até 5 MB"}
          </span>
          <input
            id="ins-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onExtraChange({ imageFile: f });
            }}
          />
        </label>
      </div>
    </div>
  );
}

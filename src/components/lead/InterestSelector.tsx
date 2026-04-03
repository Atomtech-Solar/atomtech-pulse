import { LEAD_INTEREST_OPTIONS, type LeadInterestValue } from "@/constants/leadInterests";
import { cn } from "@/lib/utils";

type InterestSelectorProps = {
  value: LeadInterestValue;
  onChange: (v: LeadInterestValue) => void;
  disabled?: boolean;
};

export function InterestSelector({ value, onChange, disabled }: InterestSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">Tipo de interesse</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {LEAD_INTEREST_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-in-out sm:w-auto sm:min-w-0 sm:flex-1 sm:px-4",
                active
                  ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_0_1px_rgba(20,171,93,0.35)]"
                  : "border-white/10 bg-black/20 text-[#a1a1aa] hover:border-white/20 hover:text-white",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

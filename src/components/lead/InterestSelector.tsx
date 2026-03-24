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
      {/* Mobile: scroll horizontal */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory scrollbar-thin sm:mx-0 sm:flex-wrap sm:overflow-visible">
        {LEAD_INTEREST_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                "shrink-0 snap-start rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-in-out sm:min-w-0 sm:flex-1 sm:px-4",
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

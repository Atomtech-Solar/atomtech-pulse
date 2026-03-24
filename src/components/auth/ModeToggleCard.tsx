import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ModeToggleCardProps = {
  active: boolean;
  /** Clique ativa este modo (só quando `active` é false). */
  onActivate?: () => void;
  /** Texto de apoio no bloco inativo. */
  supportText?: string;
  children: ReactNode;
  className?: string;
};

export function ModeToggleCard({ active, onActivate, supportText, children, className }: ModeToggleCardProps) {
  const inactive = !active;

  return (
    <div
      role={inactive ? "button" : undefined}
      tabIndex={inactive ? 0 : undefined}
      onClick={() => inactive && onActivate?.()}
      onKeyDown={(e) => {
        if (!inactive || !onActivate) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "rounded-2xl border-2 bg-card/80 p-5 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out sm:p-8",
        active
          ? "z-10 scale-100 border-emerald-500 opacity-100 shadow-emerald-500/10"
          : "scale-95 cursor-pointer border-zinc-700 opacity-60 hover:scale-[1.02] hover:opacity-80",
        className
      )}
    >
      {inactive && supportText ? (
        <p className="mb-4 text-center text-sm leading-relaxed text-muted-foreground">{supportText}</p>
      ) : null}
      <div className={cn(inactive && "pointer-events-none select-none")}>{children}</div>
    </div>
  );
}

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
        "min-w-0 rounded-2xl border-2 bg-card/80 shadow-xl backdrop-blur-sm transition-[padding,opacity,border-color,box-shadow] duration-500 ease-in-out",
        active
          ? "z-10 border-emerald-500 p-5 opacity-100 shadow-emerald-500/10 sm:p-8"
          : "cursor-pointer border-zinc-700 p-4 opacity-60 hover:opacity-90 sm:p-5",
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

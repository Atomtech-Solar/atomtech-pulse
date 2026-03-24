import { cn } from "@/lib/utils";

/** Inputs do funil de leads — foco verde alinhado à landing */
export const leadInputClass = cn(
  "h-11 border-white/10 bg-[#141414] text-white placeholder:text-zinc-500",
  "transition-all duration-300 ease-in-out",
  "focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
);

export const leadTextareaClass = cn(
  "min-h-[88px] resize-none border-white/10 bg-[#141414] text-white placeholder:text-zinc-500",
  "transition-all duration-300 ease-in-out",
  "focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
);

export const leadSelectClass = cn(
  leadInputClass,
  "cursor-pointer appearance-none bg-[#141414] pr-10"
);

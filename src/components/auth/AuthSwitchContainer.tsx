import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LeadForm } from "@/components/auth/LeadForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { cn } from "@/lib/utils";

const panelTransition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

type Mode = "lead" | "register";

export function AuthSwitchContainer() {
  const [mode, setMode] = useState<Mode>("register");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mx-auto mb-6 flex w-full max-w-lg rounded-xl border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 sm:py-3 sm:text-base",
            mode === "lead"
              ? "bg-[#14AB5D] text-white shadow-md"
              : "text-[#a1a1aa] hover:text-white"
          )}
          onClick={() => setMode("lead")}
        >
          Formulário
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 sm:py-3 sm:text-base",
            mode === "register"
              ? "bg-[#14AB5D] text-white shadow-md"
              : "text-[#a1a1aa] hover:text-white"
          )}
          onClick={() => setMode("register")}
        >
          Cadastro
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-emerald-500 bg-card/90 p-5 shadow-lg shadow-emerald-500/10 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={panelTransition}
          >
            {mode === "lead" ? <LeadForm /> : <RegisterForm embedded plainChrome />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

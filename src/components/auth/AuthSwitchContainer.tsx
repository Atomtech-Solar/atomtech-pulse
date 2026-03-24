import { useState } from "react";
import { LeadForm } from "@/components/auth/LeadForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ModeToggleCard } from "@/components/auth/ModeToggleCard";

type Mode = "lead" | "register";

export function AuthSwitchContainer() {
  const [mode, setMode] = useState<Mode>("lead");

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Mobile: tabs + painel único */}
      <div className="lg:hidden">
        <div className="mb-6 flex rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
              mode === "lead" ? "bg-[#14AB5D] text-white shadow-md" : "text-[#a1a1aa] hover:text-white"
            }`}
            onClick={() => setMode("lead")}
          >
            Interesse
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
              mode === "register" ? "bg-[#14AB5D] text-white shadow-md" : "text-[#a1a1aa] hover:text-white"
            }`}
            onClick={() => setMode("register")}
          >
            Cadastro
          </button>
        </div>

        <div className="rounded-2xl border-2 border-emerald-500 bg-card/90 p-5 shadow-lg shadow-emerald-500/10 sm:p-8">
          {mode === "lead" ? <LeadForm /> : <RegisterForm embedded plainChrome />}
        </div>
      </div>

      {/* Desktop: duas colunas — ativo à esquerda */}
      <div className="hidden items-start gap-6 lg:grid lg:grid-cols-2">
        {mode === "lead" ? (
          <>
            <ModeToggleCard active>
              <LeadForm interactive />
            </ModeToggleCard>
            <ModeToggleCard
              active={false}
              onActivate={() => setMode("register")}
              supportText="Crie sua conta para acompanhar tudo em tempo real."
            >
              <RegisterForm embedded plainChrome interactive={false} />
            </ModeToggleCard>
          </>
        ) : (
          <>
            <ModeToggleCard active>
              <RegisterForm embedded plainChrome interactive />
            </ModeToggleCard>
            <ModeToggleCard
              active={false}
              onActivate={() => setMode("lead")}
              supportText="Só quer falar com a gente? Leva menos de 10 segundos."
            >
              <LeadForm interactive={false} />
            </ModeToggleCard>
          </>
        )}
      </div>
    </div>
  );
}

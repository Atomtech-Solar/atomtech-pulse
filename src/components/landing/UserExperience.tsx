import { Zap, Medal, Leaf } from "lucide-react";

const PHONE_WIDTH = 280;

function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-5 group">
      <div
        className="relative overflow-hidden rounded-[2.75rem] transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          width: PHONE_WIDTH,
          boxShadow:
            "0 0 0 3px #27272a, 0 0 0 6px #18181b, 0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
          background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        {/* Bezel superior com notch */}
        <div className="absolute top-0 left-0 right-0 h-8 z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl z-20 flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        </div>

        {/* Tela com cantos internos */}
        <div
          className="relative pt-10 pb-8 px-6 min-h-[min(580px,85svh)] sm:min-h-[580px] flex flex-col rounded-[2rem] mx-1.5 mb-1.5 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          {children}
        </div>
      </div>
      {label && (
        <span className="text-sm text-[#a1a1aa] font-medium tracking-wide">{label}</span>
      )}
    </div>
  );
}

function Phone1Ad() {
  return (
    <PhoneFrame label="1. Ad Premium (5s)">
      {/* Skip button */}
      <div className="absolute top-12 right-6 z-20">
        <button className="px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-medium backdrop-blur-sm transition-colors">
          Pular em 4s
        </button>
      </div>

      {/* Centro: ícone raio */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(20,171,93,0.15) 0%, rgba(5,150,105,0.08) 100%)",
            boxShadow: "0 0 40px rgba(20,171,93,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            border: "1px solid rgba(20,171,93,0.3)",
          }}
        >
          <Zap className="w-9 h-9 text-[#14AB5D]" />
        </div>
        <h3 className="text-lg font-bold text-white text-center tracking-tight">Marca Patrocinadora</h3>
        <p className="text-sm text-[#a1a1aa]/90 text-center max-w-[200px] leading-relaxed">
          Apoiando a transição energética global.
        </p>
      </div>

      {/* Rodapé: barra de progresso */}
      <div className="mt-auto space-y-2.5">
        <div className="h-2 rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#14AB5D] to-[#14AB5D] transition-all duration-500"
            style={{ width: "70%", boxShadow: "0 0 12px rgba(20,171,93,0.5)" }}
          />
        </div>
        <p className="text-[11px] text-[#a1a1aa] uppercase tracking-widest font-medium">Carregando Arcade...</p>
      </div>
    </PhoneFrame>
  );
}

function Phone2Gameplay() {
  return (
    <PhoneFrame label="2. Gameplay Estilizado">
      {/* Score top left */}
      <div className="absolute top-12 left-6 z-20">
        <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest font-medium">Score</p>
        <p
          className="text-2xl font-mono font-bold tracking-wider tabular-nums"
          style={{ color: "#14AB5D", textShadow: "0 0 20px rgba(20,171,93,0.4)" }}
        >
          024,850
        </p>
      </div>

      {/* Badge top right */}
      <div className="absolute top-12 right-6 z-20 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-[#a1a1aa] text-xs font-medium">
        #AD
      </div>

      {/* Centro: ícone + órbitas */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 relative">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Órbitas ovais com bolas LED */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="orbit orbit-1">
              <span className="orbit-dot" />
            </div>
            <div className="orbit orbit-2">
              <span className="orbit-dot" />
            </div>
          </div>
          {/* Ícone central */}
          <div
            className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(20,171,93,0.2) 0%, rgba(5,150,105,0.1) 100%)",
              boxShadow: "0 0 30px rgba(20,171,93,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
              border: "1px solid rgba(20,171,93,0.35)",
            }}
          >
            <Zap className="w-8 h-8 text-[#14AB5D]" />
          </div>
        </div>
        <p className="text-xs text-[#a1a1aa]/90 text-center max-w-[220px] leading-relaxed">
          Mecânica Arcade: Toque nos fluxos de energia
        </p>
      </div>
    </PhoneFrame>
  );
}

function Phone3Reward() {
  return (
    <PhoneFrame label="3. Recompensa (ESG ou Vantagem)">
      {/* Centro: prêmio */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)",
            boxShadow: "0 0 35px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            border: "1px solid rgba(245,158,11,0.35)",
          }}
        >
          <Medal className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-white text-center tracking-tight">Recarga Concluída!</h3>
        <p className="text-sm text-[#a1a1aa]/90 text-center">
          Você acumulou{" "}
          <span className="text-[#14AB5D] font-bold" style={{ textShadow: "0 0 12px rgba(20,171,93,0.4)" }}>
            1.250 pts
          </span>
        </p>
      </div>

      {/* Botões */}
      <div className="mt-auto space-y-3">
        <button className="w-full py-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/50 text-white text-sm font-medium transition-all hover:border-zinc-600/50">
          Resgatar 15% OFF
        </button>
        <p className="text-[11px] text-[#a1a1aa] text-center">Em cafés parceiros locais</p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-700/80" />
          <span className="text-xs text-[#a1a1aa] font-medium">ou</span>
          <div className="flex-1 h-px bg-zinc-700/80" />
        </div>

        <button className="w-full py-3.5 rounded-xl border-2 border-[#14AB5D]/50 text-[#14AB5D] hover:bg-[#14AB5D]/10 hover:border-[#14AB5D]/60 text-sm font-medium transition-all flex items-center justify-center gap-2">
          <Leaf className="w-4 h-4" />
          Doar para ONG
        </button>
        <p className="text-[11px] text-[#14AB5D]/90 text-center">Plantio de 1 árvore garantido</p>
      </div>
    </PhoneFrame>
  );
}

export default function UserExperience() {
  return (
    <section
      id="experiencia"
      className="flex flex-col justify-center items-center py-16 sm:py-24 px-4 sm:px-6 bg-[#030712]"
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-white mb-4">
          A Experiência do Usuário
        </h2>
        <p className="text-center text-[#a1a1aa] max-w-2xl mx-auto mb-12 sm:mb-16">
          Uma jornada fluida projetada para o público de alta renda. Rápida, bonita e recompensadora.
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-8">
          <Phone1Ad />
          <Phone2Gameplay />
          <Phone3Reward />
        </div>
      </div>
    </section>
  );
}

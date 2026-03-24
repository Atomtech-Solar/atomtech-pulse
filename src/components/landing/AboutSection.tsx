import { TrendingUp, Gamepad2, Leaf, Heart } from "lucide-react";

const STAT_CARDS = [
  {
    icon: Gamepad2,
    value: "100%",
    label: "ATENÇÃO FOCADA",
  },
  {
    icon: Heart,
    value: "Share",
    label: "RECEITA C/ MARCAS",
  },
  {
    icon: Leaf,
    quote: "Nossas cargas reduzem a emissão de carbono no ar",
  },
];

export default function AboutSection() {
  return (
    <section
      id="sobre"
      className="flex flex-col justify-center items-center py-16 sm:py-24 px-4 sm:px-6 bg-[#030712] scroll-mt-20"
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center justify-items-center w-full">
          {/* Esquerda: 3 blocos — mesma largura máxima de leitura que a coluna "A oportunidade" */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-lg mx-auto lg:mx-0 lg:max-w-[28rem] items-stretch">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {STAT_CARDS.slice(0, 2).map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center min-h-0 sm:min-h-[148px] transition-all duration-300 hover:border-[#14AB5D]/30"
                  style={{
                    background: "linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.6) 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(20,171,93,0.2) 0%, rgba(5,150,105,0.1) 100%)",
                      border: "1px solid rgba(20,171,93,0.25)",
                      boxShadow: "0 0 20px rgba(20,171,93,0.1)",
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#14AB5D]" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
                  <span className="text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider mt-1.5 font-medium leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center min-h-0 sm:min-h-[120px] transition-all duration-300 hover:border-sky-500/30"
              style={{
                background: "linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.6) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
                style={{
                  background: "linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(2,132,199,0.1) 100%)",
                  border: "1px solid rgba(14,165,233,0.25)",
                  boxShadow: "0 0 20px rgba(14,165,233,0.1)",
                }}
              >
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-snug max-w-md">
                &quot;{STAT_CARDS[2].quote}&quot;
              </p>
            </div>
          </div>

          {/* Direita: conteúdo A oportunidade */}
          <div className="flex flex-col justify-center items-center text-center lg:items-start lg:text-left w-full max-w-lg mx-auto lg:mx-0 lg:max-w-[28rem]">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-[#14AB5D] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                A oportunidade
              </h2>
            </div>

            <p className="text-base text-[#a1a1aa] leading-relaxed mb-4">
              Proprietários de carros elétricos (público classe A/A+) enfrentam um tempo ocioso inevitável de{" "}
              <span className="font-semibold text-white">15 a 40 minutos</span> durante a recarga pública.
            </p>

            <p className="text-base text-[#a1a1aa] leading-relaxed mb-8">
              Esse momento gera uma <span className="font-semibold text-white">audiência cativa de altíssimo valor</span>.
              O objetivo do EcoArcade é preencher esse tempo com uma experiência arcade rápida, sofisticada e recompensadora,
              integrada diretamente à plataforma da Atomtech.
            </p>

            {/* Itens com ícone à esquerda */}
            <div className="space-y-5 w-full">
              <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start text-center lg:text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-[#14AB5D]" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Patrocínios Premium</h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    Inserção orgânica de marcas sem poluição visual.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start text-center lg:text-left">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Forte Apelo ESG</h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    Recompensas convertidas em doações e métricas de carbono.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

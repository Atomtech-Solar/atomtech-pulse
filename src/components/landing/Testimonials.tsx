import { useState } from "react";
import { ArrowUpRight, Quote } from "lucide-react";
import { Star } from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop";

const TESTIMONIALS = [
  {
    text: "A experiência de recarga ficou muito mais engajante. Os pontos e recompensas fazem toda a diferença no dia a dia.",
    name: "Mariana Silva",
    role: "Proprietária de frota",
    date: "15 Jan 2025",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    text: "O app gamificado mudou a forma como nossos clientes interagem com as estações. Adesão subiu 40% no primeiro mês.",
    name: "Ricardo Oliveira",
    role: "Diretor de operações",
    date: "22 Jan 2025",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    text: "Solução completa para mobilidade elétrica. Gestão fácil, usuários satisfeitos e métricas claras em tempo real.",
    name: "Carla Mendes",
    role: "CEO, Rede EV",
    date: "08 Fev 2025",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  },
  {
    text: "A integração foi simples e o suporte excepcional. Nossa rede nunca esteve tão organizada.",
    name: "Fernando Costa",
    role: "Gestor de infraestrutura",
    date: "12 Fev 2025",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    text: "Os usuários adoram acumular pontos e trocar por benefícios. Diferencial competitivo real para nossa marca.",
    name: "Juliana Santos",
    role: "Head de produto",
    date: "20 Fev 2025",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
  },
  {
    text: "Implementamos em 15 estações e o retorno foi imediato. Plataforma estável e escalável.",
    name: "André Lima",
    role: "CTO",
    date: "25 Fev 2025",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
  },
];

function TestimonialCard({ text, name, role, date, avatar }: (typeof TESTIMONIALS)[0]) {
  return (
    <div className="testimonial-card flex-shrink-0 rounded-2xl bg-[#141414] border border-white/5 p-6 relative overflow-visible">
      {/* Estrelas */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#14AB5D] text-[#14AB5D]" />
        ))}
      </div>

      {/* Texto */}
      <p className="text-white/90 text-sm leading-relaxed mb-5 min-h-[72px]">{text}</p>

      {/* Avatar + Nome + Data */}
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border border-white/10"
        />
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">{name}</span>
          <span className="text-[#a1a1aa] text-xs">{role}</span>
          <span className="text-[#a1a1aa]/80 text-[11px] mt-0.5">{date}</span>
        </div>
      </div>

      {/* Notch com ícone de aspas */}
      <div
        className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-[#14AB5D] flex items-center justify-center shadow-lg"
        style={{ boxShadow: "0 0 20px rgba(20,171,93,0.4)" }}
      >
        <Quote className="w-5 h-5 text-white fill-white" />
      </div>
    </div>
  );
}

function MarqueeColumn({ isPaused }: { isPaused: boolean }) {
  return (
    <div
      className="flex flex-col gap-5 animate-marquee-vertical w-full"
      style={{ animationPlayState: isPaused ? "paused" : "running" }}
    >
      {["a", "b"].map((prefix) =>
        TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={`${prefix}-${i}`} {...t} />
        ))
      )}
    </div>
  );
}

export default function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section id="depoimentos" className="py-16 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-stretch">
          {/* Esquerda: bloco grande com foto + título em cima */}
          <div className="relative rounded-3xl overflow-hidden min-h-[420px] lg:min-h-[520px]">
            <img
              src={HERO_IMAGE}
              alt="Equipe e mobilidade elétrica"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay gradiente sutil */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: "linear-gradient(135deg, rgba(20,171,93,0.15) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
              }}
            />

            {/* Bloco do título com efeito notch (top-left) */}
            <div className="absolute top-0 left-0 p-6 sm:p-8 z-10">
              <div
                className="testimonial-title-block flex items-center gap-3 px-6 py-4"
                style={{
                  background: "rgba(0,0,0,0.9)",
                }}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Depoimentos dos nossos{" "}
                  <span className="text-[#14AB5D]">usuários</span>
                </h2>
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-[#14AB5D] flex items-center justify-center"
                  style={{ boxShadow: "0 0 16px rgba(20,171,93,0.5)" }}
                >
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Direita: coluna com scroll vertical de depoimentos (3 visíveis, pause no hover) */}
          <div
            className="relative h-[480px] lg:h-[560px] overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Conteúdo com padding interno */}
            <div className="h-full w-full px-4 py-6">
              <MarqueeColumn isPaused={isPaused} />
            </div>

            {/* Blur preto em cima e embaixo para ligar com o fundo */}
            <div
              className="absolute inset-x-0 top-0 h-20 pointer-events-none z-10"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-10"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

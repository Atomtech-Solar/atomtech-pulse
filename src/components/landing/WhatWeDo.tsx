import { Link } from "react-router-dom";
import {
  Zap,
  MapPin,
  BarChart3,
  Shield,
  Battery,
  ArrowUpRight,
  Settings,
} from "lucide-react";

const SERVICES = [
  {
    icon: Zap,
    title: "Economia Inteligente",
    description: "Pague menos por kWh e ainda receba benefícios. Na TOP UP, o custo da recarga volta para você em forma de recompensas.",
  },
  {
    icon: MapPin,
    title: "Energia que Vira Jogo",
    description: "Transformamos o tempo de recarga em uma experiência interativa com moedas, bônus e desafios em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Audiência de Alto Valor",
    description: "Motoristas permanecem de 15 a 40 minutos conectados. Um público premium, altamente engajado e pronto para interagir.",
  },
  {
    icon: Shield,
    title: "Patrocínios Premium",
    description: "Marcas aparecem de forma nativa na experiência. Sem poluição visual, com alto impacto e engajamento real.",
  },
  {
    icon: Battery,
    title: "ESG Integrado",
    description: "Recompensas podem ser convertidas em doações e impacto ambiental, conectando tecnologia com propósito.",
  },
  {
    icon: Settings,
    title: "Ecossistema Inteligente",
    description: "Carregadores, usuários e marcas conectados em uma única plataforma que transforma a cidade em mídia e experiência.",
  },
];

export default function WhatWeDo() {
  return (
    <section
      id="features"
      className="flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 bg-black"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-white mb-8 sm:mb-10">
          O que fazemos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full justify-items-stretch">
          {SERVICES.map((service, i) => (
            <ServiceCard
              key={service.title}
              index={i + 1}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  index,
  icon: Icon,
  title,
  description,
}: {
  index: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group relative rounded-xl min-h-0 md:min-h-[200px] overflow-visible service-card w-full max-w-md mx-auto sm:max-w-none"
      onMouseEnter={(e) => {
        e.currentTarget.classList.add("service-card-hover");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.classList.remove("service-card-hover");
      }}
    >
      {/* Camada de fundo - acima de qualquer máscara, gradiente visível */}
      <div className="absolute inset-0 rounded-xl z-0 service-card-bg pointer-events-none" />
      {/* Conteúdo */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col min-h-0 md:min-h-[200px] rounded-xl bg-transparent">
        {/* Bola com ícone */}
        <div className="absolute top-3 right-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br bg-[#14AB5D] flex items-center justify-center shadow-lg z-20 group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>

        {/* Título e texto - esquerda em cima */}
        <div className="flex-1 pr-16 sm:pr-20">
          <h3 className="text-base sm:text-[1.05rem] font-bold text-white mb-1.5">{title}</h3>
          <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed mb-4">{description}</p>

          {/* Botão Ver mais */}
          <Link
            to="#"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/30 text-white text-xs font-medium hover:bg-white hover:text-[#14AB5D] hover:border-white transition-all duration-200 w-fit"
          >
            <span>Ver mais</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Número do bloco - direita embaixo */}
        <span
          className="absolute bottom-3 right-4 text-4xl sm:text-5xl font-bold text-white/10 select-none pointer-events-none"
          aria-hidden
        >
          {index}.
        </span>
      </div>
    </div>
  );
}

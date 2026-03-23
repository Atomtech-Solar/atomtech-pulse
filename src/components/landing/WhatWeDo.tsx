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
    title: "Rede de recarga",
    description: "Conecte seu carregador à maior rede gamificada de mobilidade elétrica do Brasil.",
  },
  {
    icon: MapPin,
    title: "Pontos de carga",
    description: "Encontre estações próximas e gerencie sua rede de pontos de forma inteligente.",
  },
  {
    icon: BarChart3,
    title: "Gestão e analytics",
    description: "Acompanhe sessões, receita e métricas em tempo real no seu dashboard.",
  },
  {
    icon: Shield,
    title: "Segurança OCPP",
    description: "Protocolo padronizado para comunicação segura entre estações e sistema.",
  },
  {
    icon: Battery,
    title: "Carga inteligente",
    description: "Controle horários, tarifas e disponibilidade dos conectores remotamente.",
  },
  {
    icon: Settings,
    title: "Integração total",
    description: "API e webhooks para integrar com seu sistema de gestão ou aplicativo.",
  },
];

export default function WhatWeDo() {
  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-white mb-12 sm:mb-16">
          O que fazemos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      className="group relative rounded-2xl min-h-[240px] overflow-visible service-card"
      onMouseEnter={(e) => {
        e.currentTarget.classList.add("service-card-hover");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.classList.remove("service-card-hover");
      }}
    >
      {/* Camada de fundo - acima de qualquer máscara, gradiente visível */}
      <div className="absolute inset-0 rounded-2xl z-0 service-card-bg pointer-events-none" />
      {/* Conteúdo */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col min-h-[240px] rounded-2xl bg-transparent">
        {/* Bola com ícone */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br bg-[#14AB5D] flex items-center justify-center shadow-lg z-20 group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-10 h-10 text-white" />
        </div>

        {/* Título e texto - esquerda em cima */}
        <div className="flex-1 pr-24">
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-[#a1a1aa] leading-relaxed mb-6">{description}</p>

          {/* Botão Ver mais */}
          <Link
            to="#"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white hover:text-[#14AB5D] hover:border-white transition-all duration-200 w-fit"
          >
            <span>Ver mais</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Número do bloco - direita embaixo */}
        <span
          className="absolute bottom-5 right-6 text-5xl font-bold text-white/10 select-none pointer-events-none"
          aria-hidden
        >
          {index}.
        </span>
      </div>
    </div>
  );
}

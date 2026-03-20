import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

// Substitua pelas fotos reais dos fundadores em /public/img/founders/
const FOUNDERS = [
  { name: "Fundador 1", avatar: "https://ui-avatars.com/api/?name=F1&size=80&background=ff5e00&color=fff" },
  { name: "Fundador 2", avatar: "https://ui-avatars.com/api/?name=F2&size=80&background=ff5e00&color=fff" },
  { name: "Fundador 3", avatar: "https://ui-avatars.com/api/?name=F3&size=80&background=ff5e00&color=fff" },
  { name: "Fundador 4", avatar: "https://ui-avatars.com/api/?name=F4&size=80&background=ff5e00&color=fff" },
];

const SPONSORS = [
  { name: "Atom Tech", icon: Zap },
  { name: "Parceiro 1", icon: Zap },
  { name: "Parceiro 2", icon: Zap },
  { name: "Parceiro 3", icon: Zap },
];

export default function Hero() {
  return (
    <section className="relative h-[95vh] flex flex-col items-center px-4 sm:px-6 text-center overflow-hidden">
      {/* Background: mountain image with overlay for text readability */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-mountains.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-black/70" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full h-full max-w-3xl mx-auto flex flex-col min-h-0">
        {/* Topo: time/equipe */}
        <div className="shrink-0 pt-8 sm:pt-12 flex justify-center">
          <div className="flex -space-x-3">
            {FOUNDERS.map((founder, i) => (
              <img
                key={i}
                src={founder.avatar}
                alt={founder.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/90 object-cover shadow-lg ring-2 ring-white/50"
              />
            ))}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/90 bg-white/80 flex items-center justify-center text-xs font-semibold text-foreground shadow-lg ring-2 ring-white/50 -ml-3">
              +800
            </div>
          </div>
        </div>

        {/* Centro: título, texto e botões (ocupam o espaço do meio e ficam centralizados) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full min-h-0 py-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground drop-shadow-sm mb-4">
            TOP-UP
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
            Encontre os melhores pontos de recarga, acompanhe suas sessões e conecte-se com a rede de mobilidade elétrica—tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-full px-6 sm:px-8 h-11 sm:h-12 text-foreground bg-white hover:bg-white/90 shadow-lg"
            >
              <Link to="#features">Saiba mais</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full px-6 sm:px-8 h-11 sm:h-12 btn-energy-primary shadow-lg"
            >
              <Link to="/cadastro">Começar sua jornada</Link>
            </Button>
          </div>
        </div>

        {/* Rodapé: parcerias */}
        <div className="shrink-0 flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 sm:py-10 border-t border-white/20 w-full">
          {SPONSORS.map((sponsor, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-white font-medium opacity-90"
            >
              <sponsor.icon className="w-5 h-5 text-[#ff5e00]" />
              <span className="text-sm sm:text-base">{sponsor.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
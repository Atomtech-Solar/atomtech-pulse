import { Link } from "react-router-dom";

const PARTNERS = [
  "CASA ÉRGO",
  "COC",
  "GIRAFFAS",
  "OMODA & JAECOO",
  "MARGRAN",
  "ACERHOME",
  "RISEON",
  "HIKVISION",
  "IP77",
];

function HeroPartnersStrip() {
  const Chunk = () => (
    <div className="flex items-center gap-6 sm:gap-10 shrink-0 px-6 sm:px-10">
      {PARTNERS.map((name, i) => (
        <span key={i} className="flex items-center gap-6 sm:gap-10 shrink-0">
          <span className="hero-partner-item whitespace-nowrap text-sm sm:text-base text-white/70">
            {name}
          </span>
          {i < PARTNERS.length - 1 && (
            <span className="text-white/30 shrink-0">•</span>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        minHeight: "72px",
        maskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
    >
      <div className="flex items-center overflow-hidden w-full">
        <div
          className="flex items-center w-max"
          style={{
            animation: "hero-marquee-ltr 40s linear infinite",
          }}
        >
          <Chunk />
          <Chunk />
          <Chunk />
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col -mt-24 sm:-mt-28 h-screen bg-black">
      {/* Fundo gradiente animado (goo + blobs) */}
      <div className="gradient-bg absolute inset-0 z-0" aria-hidden>
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="hero-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        <div className="gradients-container">
          <div className="g1" />
          <div className="g2" />
          <div className="g3" />
          <div className="g4" />
          <div className="g5" />
          <div className="interactive" />
        </div>
      </div>
      {/* Overlay suave para legibilidade do texto */}
      <div className="absolute inset-0 z-[1] bg-black/35 pointer-events-none" />

      {/* Conteúdo central */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 pt-24 sm:pt-28 pb-0 text-center pointer-events-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8 text-xs sm:text-sm font-medium border border-white/10 bg-white/5 text-[#a1a1aa]"
        >
          <span className="w-2 h-2 rounded-full bg-[#14AB5D] animate-pulse" />
          Onboarding aberto
        </div>

        {/* Título */}
        <h1
          className="font-bold tracking-tight mb-4 sm:mb-6 max-w-4xl"
          style={{
            fontSize: "clamp(2rem, 5.5vw, 4rem)",
            lineHeight: 1.1,
            color: "#FFFFFF",
          }}
        >
          Recarga elétrica, agora como experiência
        </h1>

        {/* Subtexto */}
        <p className="text-base sm:text-lg text-[#a1a1aa] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          A primeira rede gamificada de recarga para veículos elétricos do Brasil
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-14">
          <Link
            to="/cadastro"
            className="hero-btn-primary inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300"
          >
            Começar agora
          </Link>
          <Link
            to="#features"
            className="hero-btn-secondary inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-white border-2 border-white/40 bg-transparent transition-all duration-300 hover:border-[#14AB5D]"
          >
            Ver como funciona
          </Link>
        </div>

        {/* Mini título + faixa de parceiros (janela limitada) */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-[#a1a1aa]/80 font-medium mb-4 sm:mb-5 text-center">
            Mais de <span className="text-white font-semibold">10+</span> empresas são nossas parceiras
          </p>
          <HeroPartnersStrip />
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";

import logoCasaErgo from "../../../img/casa-ergo.png";
import logoCoc from "../../../img/coc.jfif";
import logoGiraffas from "../../../img/giraffas.jpg";
import logoOmodaJaecoo from "../../../img/logo_omoda-jaecoo.png";
import logoMargran from "../../../img/margran.jfif";
import logoAcHome from "../../../img/AC-Home-Marca.webp";
import logoRiseon from "../../../img/riseon_brasil_logo.jfif";
import logoHikvision from "../../../img/hikvision.jfif";
import logoIp77 from "../../../img/ip77.jfif";

const PARTNER_LOGOS: { src: string; alt: string }[] = [
  { src: logoCasaErgo, alt: "Casa Érgo" },
  { src: logoCoc, alt: "COC" },
  { src: logoGiraffas, alt: "Giraffas" },
  { src: logoOmodaJaecoo, alt: "Omoda e Jaecoo" },
  { src: logoMargran, alt: "Margran" },
  { src: logoAcHome, alt: "Acerhome" },
  { src: logoRiseon, alt: "Riseon" },
  { src: logoHikvision, alt: "Hikvision" },
  { src: logoIp77, alt: "IP77" },
];

function HeroPartnersStrip() {
  const Chunk = () => (
    <div className="flex items-center gap-5 sm:gap-8 md:gap-10 shrink-0 px-6 sm:px-10">
      {PARTNER_LOGOS.map(({ src, alt }, i) => (
        <div
          key={`${alt}-${i}`}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full overflow-hidden"
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-full object-contain object-center pointer-events-none select-none"
          />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div
        className="relative w-full overflow-hidden rounded-lg"
        aria-hidden
        style={{
          minHeight: "88px",
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
      <p className="sr-only">
        Logotipos de parceiros: {PARTNER_LOGOS.map((p) => p.alt).join(", ")}.
      </p>
    </>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col -mt-24 sm:-mt-28 min-h-dvh bg-black">
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 sm:px-8 lg:px-12 pt-24 sm:pt-28 pb-10 sm:pb-12 text-center pointer-events-auto min-h-0">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8 text-xs sm:text-sm font-medium border border-white/10 bg-white/5 text-[#a1a1aa]"
        >
          <span className="w-2 h-2 rounded-full bg-[#14AB5D] animate-pulse" />
          Experiência gamificada
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
          Recarga elétrica, agora é experiência
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

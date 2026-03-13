import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import robotImage from "../../../img/Robo.png";

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-0 text-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]" />
        </div>
      </div>
      <div className="absolute left-4 sm:left-10 top-1/4 sm:top-1/3 w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-[#ff4d00]/30 blur-[70px]" />
      <div className="absolute right-4 sm:right-16 bottom-1/4 sm:bottom-1/3 w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-[#ff5e00]/30 blur-[70px]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto pt-0">
        <p className="text-[10px] min-[400px]:text-[11px] sm:text-sm tracking-[0.3em] sm:tracking-[0.55em] text-[#ff5e00] uppercase mb-6 sm:mb-8 px-2">
          A primeira rede de recargas VE gamificadas do Brasil
        </p>

        <div className="relative mb-6 sm:mb-8 h-[280px] min-[400px]:h-[320px] sm:h-[400px] md:h-[480px] lg:h-[500px]">
          <h1 className="relative z-10 text-5xl min-[400px]:text-6xl sm:text-7xl md:text-[100px] lg:text-[130px] font-black italic tracking-tight text-white/95 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)] shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]">
            TOP-UP
          </h1>
          <div className="absolute inset-0 z-0 text-5xl min-[400px]:text-6xl sm:text-7xl md:text-8xl font-black italic tracking-tight text-white/10 translate-x-1 translate-y-1 pointer-events-none">
            TOP-UP
          </div>
          <img
            src={robotImage}
            alt="Robô TOP UP"
            className="absolute z-20 left-1/2 -translate-x-1/2 w-[220px] min-[400px]:w-[260px] sm:w-[360px] md:w-[520px] lg:w-[600px] xl:w-[700px] h-[260px] min-[400px]:h-[300px] sm:h-[380px] md:h-[460px] lg:h-[500px] align-top object-contain drop-shadow-[0_0_30px_rgba(255,77,0,0.35)]"
          />
        </div>

        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto mt-2 mb-8 sm:mb-10">
          .
        </p>

        <Button
          asChild
          size="lg"
          className="text-sm sm:text-base px-8 sm:px-10 h-11 sm:h-12 rounded-full btn-energy-primary hover-glow-energy mt-6 sm:mt-10 md:mt-12 w-full max-w-[280px] sm:max-w-none sm:w-auto"
        >
          <Link to="/cadastro">Começar Agora</Link>
        </Button>
      </div>
    </section>
  );
}

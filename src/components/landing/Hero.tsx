import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import robotImage from "../../../img/Robo.png";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#120400]" />
        </div>
      </div>
      <div className="absolute left-10 top-1/3 w-44 h-44 rounded-full bg-[#ff4d00]/30 blur-[70px]" />
      <div className="absolute right-16 bottom-1/3 w-44 h-44 rounded-full bg-[#ff5e00]/30 blur-[70px]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto pt-24">
        <p className="text-[11px] sm:text-sm tracking-[0.55em] text-[#ff5e00] uppercase mb-8">
          A primeira rede de recargas VE gamificadas do Brasil
        </p>

        <div className="relative mb-8 h-[300px] sm:h-[360px] md:h-[430px]">
          <h1 className="relative z-10 text-6xl sm:text-7xl md:text-[130px] font-black italic tracking-tight text-white/95 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)] shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]">
            TOP-UP
          </h1>
          <div className="absolute inset-0 z-0 text-6xl sm:text-7xl md:text-8xl font-black italic tracking-tight text-white/10 translate-x-1 translate-y-1 pointer-events-none">
            TOP-UP
          </div>
          <img
            src={robotImage}
            alt="Robô TOP UP"
            className="absolute z-20 left-1/2 -translate-x-1/2 w-[240px] sm:w-[300px] md:w-[360px] lg:w-[800px] h-[400px] align-top object-contain drop-shadow-[0_0_30px_rgba(255,77,0,0.35)]"
          />
        </div>

        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto mt-2 mb-10">
          .
        </p>

        <Button
          asChild
          size="lg"
          className="text-base px-10 h-12 rounded-full btn-energy-primary hover-glow-energy"
        >
          <Link to="/cadastro">Começar Agora</Link>
        </Button>
      </div>
    </section>
  );
}

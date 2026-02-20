import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          Plataforma SaaS para mobilidade elétrica
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Gestão Inteligente de{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Carregadores Veiculares
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Controle, monitore e monetize sua rede de carregadores em tempo real
        </p>

        <Button asChild size="lg" className="text-base px-8 h-12">
          <Link to="/cadastro">Começar Agora</Link>
        </Button>
      </div>
    </section>
  );
}

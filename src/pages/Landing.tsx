import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-black/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground font-semibold">
            <Zap className="w-5 h-5 text-[#ff5e00]" />
            TOP-UP
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="btn-energy-primary rounded-full px-6">
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <Features />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

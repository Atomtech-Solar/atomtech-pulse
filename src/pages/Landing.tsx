import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Menu } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = (
    <>
      <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
      </Button>
      <Button asChild className="btn-energy-primary rounded-full px-6">
        <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>Cadastrar</Link>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-black/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-foreground font-semibold shrink-0">
            <Zap className="w-5 h-5 text-[#ff5e00]" />
            <span className="text-base sm:text-lg">TOP-UP</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-3">
            {navLinks}
          </nav>

          {/* Mobile nav - hamburger + sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-black/95 border-border/60">
              <div className="flex flex-col gap-4 pt-8">
                <Button variant="ghost" asChild className="justify-start text-foreground hover:bg-white/10 h-11">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                </Button>
                <Button asChild className="btn-energy-primary rounded-full h-11 justify-center">
                  <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>Cadastrar</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
          Você vai participar ou assistir?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
          O futuro da mobilidade está sendo construído agora.
        </p>
        <Button asChild size="lg" className="text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 w-full sm:w-auto max-w-[240px] sm:max-w-none">
          <Link to="/cadastro">Participar</Link>
        </Button>
      </div>
    </section>
  );
}

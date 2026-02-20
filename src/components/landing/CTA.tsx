import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Pronto para escalar sua operação?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Crie sua conta e comece a gerenciar sua rede de carregadores em minutos.
        </p>
        <Button asChild size="lg" className="text-base px-8 h-12">
          <Link to="/cadastro">Criar Conta</Link>
        </Button>
      </div>
    </section>
  );
}

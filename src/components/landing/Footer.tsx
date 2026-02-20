import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-foreground font-semibold hover:text-primary transition-colors">
          <Zap className="w-5 h-5 text-primary" />
          TOP-UP
        </Link>
        <p className="text-sm text-muted-foreground">
          Gestão inteligente de carregadores veiculares
        </p>
      </div>
    </footer>
  );
}

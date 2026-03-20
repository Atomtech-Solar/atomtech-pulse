import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <Link to="/" className="flex items-center gap-2 text-foreground font-semibold hover:text-primary transition-colors">
          <Zap className="w-5 h-5 text-primary shrink-0" />
          <span>TOP-UP</span>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Gestão inteligente de carregadores veiculares
        </p>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, Menu } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Início", hash: null },
  { to: "/#sobre", label: "Sobre nós", hash: "sobre" },
  { to: "/#experiencia", label: "Experiência", hash: "experiencia" },
  { to: "/#depoimentos", label: "Depoimentos", hash: "depoimentos" },
  { to: "/#auth", label: "Cadastrar", hash: "auth" },
  { to: "/politica-de-privacidade", label: "Privacidade", hash: null },
];

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent, to: string, hash: string | null) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") return;
    if (hash) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", to);
    } else if (to === "/" && window.location.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] pt-4 px-4">
      <div className="w-[90%] mx-auto rounded-2xl border border-white/10 bg-[#000000]/90 backdrop-blur-md px-4 sm:px-6 h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
        {/* Esquerda: logo + nome */}
        <Link to="/" className="flex items-center gap-2 text-white font-semibold shrink-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#14AB5D" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl">TOP-UP</span>
        </Link>

        {/* Centro: links de navegação (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, hash }) => (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleNavClick(e, to, hash)}
              className="px-3 py-2 text-base text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Direita: Login (simples) + Cadastrar (destaque) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="text-base text-white/90 hover:text-white transition-colors px-3 py-2"
          >
            Login
          </Link>
          <Link
            to="/#auth"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });
                window.history.pushState(null, "", "/#auth");
              }
            }}
            className="text-base font-medium px-5 py-2.5 rounded-lg text-white hover:opacity-90 transition-opacity bg-[#14AB5D]"
          >
            Cadastrar
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay com blur no fundo quando menu aberto */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-0 left-0 right-0 bottom-0 -z-10 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-50 w-[90%] mx-auto mt-2 rounded-2xl border border-white/10 bg-[#000000]/95 backdrop-blur-md overflow-hidden">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label, hash }) => (
              <Link
                key={to}
                to={to}
                onClick={(e) => handleNavClick(e, to, hash)}
                className="px-4 py-3 text-base text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-base text-white/90 text-center"
              >
                Login
              </Link>
              <Link
                to="/#auth"
                onClick={(e) => handleNavClick(e, "/#auth", "auth")}
                className="px-4 py-3 text-base font-medium text-center rounded-lg text-white bg-[#14AB5D]"
              >
                Cadastrar
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

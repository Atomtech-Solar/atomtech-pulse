import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, Menu } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Início", hash: null },
  { to: "/#sobre", label: "Sobre nós", hash: "sobre" },
  { to: "/#experiencia", label: "Experiência", hash: "experiencia" },
  { to: "/#depoimentos", label: "Depoimentos", hash: "depoimentos" },
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
      <div className="relative z-[70] w-[90%] mx-auto rounded-2xl border border-white/10 bg-[#000000]/90 backdrop-blur-md px-4 sm:px-6 h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
        {/* Esquerda: logo + nome */}
        <Link to="/" className="flex items-center gap-2 text-white font-semibold shrink-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#14AB5D" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl">Luma Gen</span>
        </Link>

        {/* Centro: links de navegação (a partir de 1000px) */}
        <nav className="hidden min-[1000px]:flex items-center gap-1">
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
        <div className="hidden min-[1000px]:flex items-center gap-3 shrink-0">
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

        {/* Menu hamburger: abaixo de 1000px (layout tipo celular) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex min-[1000px]:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay: blur + fade (só &lt; 1000px) */}
      <div
        className={`min-[1000px]:hidden fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Painel do menu: desce suave (só &lt; 1000px) */}
      <div
        className={`min-[1000px]:hidden relative z-[65] w-[90%] mx-auto overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen
            ? "max-h-[min(75vh,520px)] opacity-100 translate-y-0 mt-2 border border-white/10 rounded-2xl bg-[#000000]/95 backdrop-blur-md shadow-lg shadow-black/40"
            : "max-h-0 opacity-0 -translate-y-2 mt-0 border-0 rounded-2xl pointer-events-none"
        }`}
      >
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
    </header>
  );
}

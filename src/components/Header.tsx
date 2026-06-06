import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, User, MessageCircle, Menu, X } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { SearchBox } from "./SearchBox";
import { buildWhatsAppLink } from "@/lib/shopify";
import { track } from "@/lib/analytics";


const nav = [
  { label: "Feminino", to: "/colecao" as const, search: { c: "feminino" as string | undefined } },
  { label: "Masculino", to: "/colecao" as const, search: { c: "masculino" } },
  { label: "Vestidos", to: "/colecao" as const, search: { c: "vestidos" } },
  { label: "Conjuntos", to: "/colecao" as const, search: { c: "conjuntos" } },
  { label: "Plus Size", to: "/colecao" as const, search: { c: "plus-size" } },
  { label: "Promoções", to: "/colecao" as const, search: { c: "promocoes" } },
  { label: "Novidades", to: "/colecao" as const, search: { c: "novidades" } },
  { label: "Sobre", to: "/sobre" as const, search: undefined },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs py-1.5 sm:py-2 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-3 flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-x-5 sm:gap-x-6 gap-y-1 whitespace-nowrap overflow-x-auto no-scrollbar">
          <span>🚚 Entregamos para toda região</span>
          <span>📱 Compre pelo WhatsApp</span>
          <span>💳 Parcelamento facilitado</span>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          className="md:hidden h-11 w-11 -ml-2 flex items-center justify-center"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">
          <span className="text-primary">MD</span> Modas
        </Link>
        <div className="hidden md:flex flex-1 max-w-md">
          <SearchBox />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href={buildWhatsAppLink("Olá! Vim pelo site da MD Modas e gostaria de ajuda.")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            onClick={() => track.whatsappClick("header")}
            className="hidden sm:inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>

          <button aria-label="Buscar" onClick={() => setMobileSearch((v) => !v)} className="md:hidden h-10 w-10 flex items-center justify-center">
            <Search className="h-5 w-5" />
          </button>
          <User className="h-5 w-5 hidden md:block" />
          <CartDrawer />
        </div>
      </div>
      {mobileSearch && (
        <div className="md:hidden px-4 pb-3"><SearchBox autoFocus onNavigate={() => setMobileSearch(false)} /></div>
      )}
      <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 pb-3 text-sm font-medium">
        {nav.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            search={n.search as never}
            className="text-foreground/80 hover:text-primary transition"
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-background shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-5 h-14 border-b">
              <span className="font-display font-extrabold text-xl"><span className="text-primary">MD</span> Modas</span>
              <button aria-label="Fechar" onClick={() => setOpen(false)} className="h-11 w-11 -mr-2 flex items-center justify-center">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-5 py-4 border-b">
              <SearchBox onNavigate={() => setOpen(false)} />
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {nav.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  search={n.search as never}
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3 text-base font-medium border-b border-border/60 hover:bg-secondary"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <a
              href={buildWhatsAppLink("Olá! Vim pelo site da MD Modas e gostaria de ajuda.")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track.whatsappClick("mobile-menu")}
              className="m-4 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-full text-sm font-semibold"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>

          </aside>
        </div>
      )}
    </header>
  );
}

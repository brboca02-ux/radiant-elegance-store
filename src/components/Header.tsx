import { Link } from "@tanstack/react-router";
import { Search, User, MessageCircle } from "lucide-react";
import { CartDrawer } from "./CartDrawer";

const nav = [
  { label: "Feminino", to: "/colecao" as const, search: { c: "feminino" as string | undefined } },
  { label: "Masculino", to: "/colecao" as const, search: { c: "masculino" } },
  { label: "Vestidos", to: "/colecao" as const, search: { c: "vestidos" } },
  { label: "Conjuntos", to: "/colecao" as const, search: { c: "conjuntos" } },
  { label: "Plus Size", to: "/colecao" as const, search: { c: "plus-size" } },
  { label: "Promoções", to: "/colecao" as const, search: { c: "promocoes" } },
  { label: "Novidades", to: "/colecao" as const, search: { c: "novidades" } },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="bg-primary text-primary-foreground text-xs py-2">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
          <span>🚚 Entregamos para toda região</span>
          <span>📱 Compre pelo WhatsApp</span>
          <span>💳 Parcelamento facilitado</span>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight">
          <span className="text-primary">MD</span> Modas
        </Link>
        <div className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-secondary rounded-full px-4 py-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <input type="search" placeholder="Buscar produtos..." className="bg-transparent flex-1 text-sm outline-none" />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <User className="h-5 w-5 hidden md:block" />
          <CartDrawer />
        </div>
      </div>
      <nav className="hidden md:flex items-center justify-center gap-8 pb-3 text-sm font-medium">
        {nav.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            search={n.search}
            className="text-foreground/80 hover:text-primary transition"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

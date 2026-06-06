import { Link } from "@tanstack/react-router";
import { Search, User } from "lucide-react";
import { CartDrawer } from "./CartDrawer";

const nav = [
  { label: "Novidades", to: "/colecao" as const, search: { c: "novidades" as string | undefined } },
  { label: "Vestidos", to: "/colecao" as const, search: { c: "vestidos" } },
  { label: "Conjuntos", to: "/colecao" as const, search: { c: "conjuntos" } },
  { label: "Alfaiataria", to: "/colecao" as const, search: { c: "alfaiataria" } },
  { label: "Tricots", to: "/colecao" as const, search: { c: "tricots" } },
  { label: "Lookbook", to: "/colecao" as const, search: { c: undefined } },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
      <div className="bg-foreground text-background text-[11px] tracking-[0.25em] uppercase py-2 text-center">
        Frete grátis em pedidos acima de R$ 499 · 10% off no Pix
      </div>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        <div className="flex-1 hidden md:flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" strokeWidth={1.25} />
          <span className="text-xs tracking-widest uppercase">Buscar</span>
        </div>
        <Link to="/" className="font-display text-2xl md:text-3xl tracking-[0.3em] uppercase">
          Aura
        </Link>
        <div className="flex-1 flex items-center justify-end gap-5">
          <User className="h-5 w-5 hidden md:block" strokeWidth={1.25} />
          <CartDrawer />
        </div>
      </div>
      <nav className="hidden md:flex items-center justify-center gap-10 pb-3 text-[11px] tracking-[0.25em] uppercase">
        {nav.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            search={n.search}
            className="text-foreground/80 hover:text-foreground transition relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:bg-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

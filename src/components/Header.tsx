import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User, MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { SearchBox } from "./SearchBox";
import { buildWhatsAppLink } from "@/lib/shopify";
import { track } from "@/lib/analytics";

type SearchParam = { c?: string };
type LinkItem = { label: string; c: string; highlight?: boolean };
type Column = { title: string; items: LinkItem[] };
type MegaContent = {
  columns: Column[];
  promo?: { title: string; subtitle?: string; cta: string; c: string };
};

const FEMININO: MegaContent = {
  columns: [
    {
      title: "Roupas",
      items: [
        { label: "Blusas", c: "blusas" },
        { label: "Camisas", c: "camisas" },
        { label: "Calças", c: "calcas" },
        { label: "Jaquetas e Casacos", c: "jaquetas" },
        { label: "Macacões", c: "macacoes" },
        { label: "Saias", c: "saias" },
        { label: "Shorts", c: "shorts" },
        { label: "Vestidos", c: "vestidos" },
        { label: "Conjuntos", c: "conjuntos" },
      ],
    },
    {
      title: "Tamanhos",
      items: [
        { label: "P", c: "tamanho-p" },
        { label: "M", c: "tamanho-m" },
        { label: "G", c: "tamanho-g" },
        { label: "GG", c: "tamanho-gg" },
        { label: "Plus Size", c: "plus-size" },
      ],
    },
    {
      title: "Coleções",
      items: [
        { label: "Recebidos da Semana", c: "recebidos-da-semana" },
        { label: "Promoções", c: "promocoes", highlight: true },
      ],
    },
  ],
  promo: {
    title: "Toda semana novidades",
    subtitle: "Peças recém-chegadas na MD Modas",
    cta: "Comprar Agora",
    c: "recebidos-da-semana",
  },
};

const MASCULINO: MegaContent = {
  columns: [
    {
      title: "Roupas",
      items: [
        { label: "Camisetas", c: "camisetas" },
        { label: "Polos", c: "polos" },
        { label: "Camisas", c: "camisas-masc" },
        { label: "Bermudas", c: "bermudas" },
        { label: "Calças", c: "calcas-masc" },
        { label: "Moletons", c: "moletons" },
        { label: "Jaquetas", c: "jaquetas-masc" },
      ],
    },
    {
      title: "Coleções",
      items: [
        { label: "Recebidos da Semana", c: "recebidos-da-semana" },
        { label: "Promoções", c: "promocoes", highlight: true },
      ],
    },
  ],
};

const INFANTIL: MegaContent = {
  columns: [
    {
      title: "Meninas",
      items: [
        { label: "Vestidos", c: "infantil-vestidos" },
        { label: "Conjuntos", c: "infantil-conjuntos-fem" },
        { label: "Blusas", c: "infantil-blusas-fem" },
        { label: "Calças e Shorts", c: "infantil-calcas-fem" },
      ],
    },
    {
      title: "Meninos",
      items: [
        { label: "Camisetas", c: "infantil-camisetas" },
        { label: "Conjuntos", c: "infantil-conjuntos-masc" },
        { label: "Bermudas", c: "infantil-bermudas" },
        { label: "Moletons", c: "infantil-moletons" },
      ],
    },
    {
      title: "Idades",
      items: [
        { label: "1 a 4 anos", c: "infantil-1-4" },
        { label: "5 a 8 anos", c: "infantil-5-8" },
        { label: "9 a 12 anos", c: "infantil-9-12" },
      ],
    },
  ],
};

const CALCADOS: MegaContent = {
  columns: [
    {
      title: "Feminino",
      items: [
        { label: "Tênis", c: "tenis-fem" },
        { label: "Sandálias", c: "sandalias" },
        { label: "Rasteirinhas", c: "rasteirinhas" },
        { label: "Botas", c: "botas-fem" },
        { label: "Scarpins", c: "scarpins" },
      ],
    },
    {
      title: "Masculino",
      items: [
        { label: "Tênis", c: "tenis-masc" },
        { label: "Sapatênis", c: "sapatenis" },
        { label: "Mocassins", c: "mocassins" },
        { label: "Chinelos", c: "chinelos" },
      ],
    },
    {
      title: "Infantil",
      items: [
        { label: "Tênis Infantil", c: "tenis-infantil" },
        { label: "Sandálias Infantis", c: "sandalias-infantil" },
      ],
    },
  ],
};

const ACESSORIOS: MegaContent = {
  columns: [
    {
      title: "Acessórios",
      items: [
        { label: "Bolsas", c: "bolsas" },
        { label: "Cintos", c: "cintos" },
        { label: "Bijuterias", c: "bijuterias" },
        { label: "Óculos", c: "oculos" },
        { label: "Lenços", c: "lencos" },
        { label: "Chapéus", c: "chapeus" },
      ],
    },
  ],
};

const PROMOCOES: MegaContent = {
  columns: [
    {
      title: "Ofertas",
      items: [
        { label: "Até 50% OFF", c: "50-off", highlight: true },
        { label: "Últimas oportunidades", c: "ultimas", highlight: true },
        { label: "Recebidos em promoção", c: "recebidos-promo", highlight: true },
      ],
    },
  ],
  promo: {
    title: "Promoções da Semana",
    subtitle: "Aproveite enquanto durar o estoque",
    cta: "Ver Ofertas",
    c: "promocoes",
  },
};

type MenuKey = "feminino" | "masculino" | "infantil" | "calcados" | "acessorios" | "promocoes" | null;

const MENUS: { key: Exclude<MenuKey, null>; label: string; content: MegaContent; highlight?: boolean; badge?: string }[] = [
  { key: "feminino", label: "Feminino", content: FEMININO },
  { key: "masculino", label: "Masculino", content: MASCULINO },
  { key: "infantil", label: "Infantil", content: INFANTIL },
  { key: "calcados", label: "Calçados", content: CALCADOS },
  { key: "acessorios", label: "Acessórios", content: ACESSORIOS },
  { key: "promocoes", label: "Promoções", content: PROMOCOES, highlight: true, badge: "PROMOÇÃO" },
];



export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
    setActiveMenu(null);
    setMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveMenu(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs py-1.5 sm:py-2 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-3 flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-x-5 sm:gap-x-6 gap-y-1 whitespace-nowrap overflow-x-auto no-scrollbar">
          <span>Entregamos para toda a região</span>
          <span>Atendimento pelo WhatsApp</span>
          <span>Parcelamento facilitado</span>
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
          <Link to="/dashboard" aria-label="Painel administrativo" title="Painel admin" className="hidden md:inline-flex h-10 w-10 items-center justify-center text-foreground/70 hover:text-primary transition">
            <User className="h-5 w-5" />
          </Link>
          <CartDrawer />
        </div>
      </div>
      {mobileSearch && (
        <div className="md:hidden px-4 pb-3"><SearchBox autoFocus onNavigate={() => setMobileSearch(false)} /></div>
      )}

      {/* Desktop nav with mega menu */}
      <div ref={navRef} className="hidden md:block relative">
        <nav className="flex items-center justify-center gap-6 lg:gap-8 pb-3 text-sm font-medium">
          {MENUS.map((m) => (
            <button
              key={m.key}
              onMouseEnter={() => setActiveMenu(m.key)}
              onFocus={() => setActiveMenu(m.key)}
              onClick={() => setActiveMenu((v) => (v === m.key ? null : m.key))}
              aria-expanded={activeMenu === m.key}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1 transition ${
                m.highlight ? "text-primary font-semibold" : "text-foreground/80"
              } hover:text-primary`}
            >
              {m.label}
              {m.badge && (
                <span className="ml-1 text-[9px] font-semibold tracking-[0.18em] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                  {m.badge}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeMenu === m.key ? "rotate-180" : ""}`} />
            </button>
          ))}
          <Link to="/colecao" search={{ c: "recebidos-da-semana" } as never} className="text-foreground/80 hover:text-primary transition">
            Recebidos da Semana
          </Link>
          <Link to="/sobre" className="text-foreground/80 hover:text-primary transition">
            Sobre
          </Link>
        </nav>


        {activeMenu && (
          <div
            onMouseLeave={() => setActiveMenu(null)}
            className="absolute left-0 right-0 top-full z-50 animate-fade-in"
          >
            <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
              <div className="bg-background border border-border rounded-2xl shadow-2xl p-8 grid grid-cols-12 gap-8">
                {MENUS.find((m) => m.key === activeMenu)!.content.columns.map((col) => (
                  <div key={col.title} className="col-span-12 sm:col-span-4 lg:col-span-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {col.title}
                    </h2>
                    <ul className="space-y-2">
                      {col.items.map((it) => (
                        <li key={it.label}>
                          <Link
                            to="/colecao"
                            search={{ c: it.c } as SearchParam as never}
                            onClick={() => setActiveMenu(null)}
                            className={`text-sm hover:text-primary transition ${
                              it.highlight ? "text-primary font-semibold" : "text-foreground/80"
                            }`}
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {MENUS.find((m) => m.key === activeMenu)!.content.promo && (
                  <div className="col-span-12 lg:col-span-3 lg:col-start-10">
                    {(() => {
                      const p = MENUS.find((m) => m.key === activeMenu)!.content.promo!;
                      return (
                        <div className="h-full bg-primary/10 border border-primary/20 rounded-xl p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-display text-lg font-bold text-primary mb-1">{p.title}</h3>
                            {p.subtitle && <p className="text-sm text-foreground/70">{p.subtitle}</p>}
                          </div>
                          <Link
                            to="/colecao"
                            search={{ c: p.c } as SearchParam as never}
                            onClick={() => setActiveMenu(null)}
                            className="mt-4 inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
                          >
                            {p.cta}
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {open && typeof document !== "undefined" && createPortal((
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
              {MENUS.map((m) => {
                const isOpen = mobileAccordion === m.key;
                return (
                  <div key={m.key} className="border-b border-border/60">
                    <button
                      onClick={() => setMobileAccordion(isOpen ? null : m.key)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center justify-between px-5 py-3 text-base font-semibold ${
                        m.highlight ? "text-primary" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {m.label}
                        {m.badge && (
                          <span className="text-[9px] font-semibold tracking-[0.18em] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                            {m.badge}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-3 space-y-3">
                          {m.content.columns.map((col) => (
                            <div key={col.title}>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 mb-1">
                                {col.title}
                              </p>
                              <ul className="space-y-1.5">
                                {col.items.map((it) => (
                                  <li key={it.label}>
                                    <Link
                                      to="/colecao"
                                      search={{ c: it.c } as SearchParam as never}
                                      onClick={() => setOpen(false)}
                                      className={`block text-sm py-1 ${
                                        it.highlight ? "text-primary font-medium" : "text-foreground/80"
                                      }`}
                                    >
                                      {it.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Link
                to="/colecao"
                search={{ c: "recebidos-da-semana" } as never}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-base font-semibold border-b border-border/60"
              >
                Recebidos da Semana
              </Link>
              <Link
                to="/sobre"
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-base font-semibold border-b border-border/60"
              >
                Sobre
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-base font-semibold border-b border-border/60 text-primary"
              >
                Painel admin
              </Link>
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
      ), document.body)}
    </header>
  );
}

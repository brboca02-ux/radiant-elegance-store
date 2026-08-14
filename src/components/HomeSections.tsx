import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import heroMobile from "@/assets/hero-mobile.jpg";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductGrid";
import { Truck, RefreshCcw, ShieldCheck, MessageCircle, MapPin, Clock, Instagram } from "lucide-react";
import { buildWhatsAppLink, STORE_INFO } from "@/lib/shopify";
import { useSiteConfig } from "@/lib/siteConfig";
import { track } from "@/lib/analytics";

export const INSTAGRAM_HANDLE = "jes.storejoinville";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

// Imagens do catálogo real, servidas pelo proxy público do storage.
const CAT_IMG = (slug: string) => `/api/public/img/catalogo/${slug}.jpg`;

const categories = [
  { label: "Feminino", alt: "Categoria Moda Feminina J&S Store", img: CAT_IMG("calca-jeans-fem-azul-medio"), q: "feminino" },
  { label: "Masculino", alt: "Categoria Moda Masculina J&S Store", img: CAT_IMG("camisa-gola-polo-importada"), q: "masculino" },
];

const diferenciais = [
  { i: Truck, t: "Frete para todo Brasil", d: "Envio expresso e seguro" },
  { i: RefreshCcw, t: "Troca facilitada", d: "Até 30 dias para você decidir" },
  { i: ShieldCheck, t: "Compra segura", d: "Pagamento criptografado" },
  { i: MessageCircle, t: "Atendimento humanizado", d: "Consultoras dedicadas" },
];

export function HomeHero() {
  const cfg = useSiteConfig();
  return (
    <section className="relative h-[88vh] min-h-[620px] lg:h-[78vh] lg:min-h-[680px] overflow-hidden bg-onyx">
      <picture>
        {/* Desktop: landscape composition, model on the left, negative space on the right */}
        <source media="(min-width: 1024px)" srcSet={hero} width={1920} height={1280} />
        {/* Mobile + tablet: dedicated portrait composition, face safe in the upper third */}
        <img
          src={heroMobile}
          alt="J&S Store — Nova Coleção"
          width={1080}
          height={1452}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_top] lg:object-[24%_center]"
        />
      </picture>
      {/* Mobile + tablet: strong bottom gradient so text sits clear of the model. Desktop: very subtle wash over negative space. */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent lg:bg-gradient-to-l lg:from-background/25 lg:via-transparent lg:to-foreground/10" />
      <div className="relative h-full max-w-[1400px] mx-auto px-6 lg:px-16 flex items-end pb-10 lg:items-center lg:pb-0 lg:justify-end">
        <div className="max-w-xl text-background lg:text-foreground">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-background/80 lg:text-foreground/70 mb-4 lg:mb-5">
            Nova Coleção
          </p>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-7xl leading-[1.04] tracking-tight">
            Moda para o seu dia,<br className="hidden lg:block" /> na sua cidade.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg mt-4 lg:mt-6 leading-relaxed font-light max-w-md text-background/90 lg:text-foreground/75">
            {cfg.heroSubtitle || "Moda feminina e masculina selecionada em Joinville."}
          </p>
          <div className="mt-6 lg:mt-10 flex flex-wrap gap-3">
            <Button size="xl" className="bg-foreground hover:bg-foreground/90 text-background rounded-none px-6 lg:px-8 font-semibold" asChild>
              <Link to="/colecao" search={{ c: "feminino" }}>Comprar Feminino</Link>
            </Button>
            <Button size="xl" variant="outline" className="bg-transparent border-background text-background lg:border-foreground lg:text-foreground hover:bg-background hover:text-foreground lg:hover:bg-foreground lg:hover:text-background rounded-none px-6 lg:px-8 font-semibold" asChild>
              <Link to="/colecao" search={{ c: "masculino" }}>Comprar Masculino</Link>
            </Button>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            
            className="mt-5 lg:mt-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-background/85 lg:text-foreground/75 hover:text-primary transition-colors group"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
            <span>Siga @{INSTAGRAM_HANDLE}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
          <div className="mt-3">
            <a
              href="#loja"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-background/70 lg:text-foreground/60 hover:text-primary transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              Visite a loja no Aventureiro, Joinville →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


export function CategoriesSection() {
  return (
    <section className="py-4 md:py-6 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Categorias</h2>
          <Link to="/colecao" search={{ c: undefined }} className="hidden md:inline text-xs font-medium text-primary hover:underline">
            Ver tudo →
          </Link>
        </div>
        <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-3 overflow-x-auto md:overflow-visible -mx-6 px-6 md:mx-0 md:px-0 scrollbar-none snap-x snap-mandatory">
          {categories.map((c) => (
            <Link
              key={c.label}
              to="/colecao"
              search={{ c: c.q }}
              className="group relative shrink-0 snap-start w-[140px] md:w-auto h-[100px] md:h-[130px] overflow-hidden bg-secondary"
            >
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-foreground/25 transition-colors duration-300 group-hover:bg-foreground/45" />
              <div className="absolute inset-x-0 bottom-0 px-3 py-2">
                <h3 className="font-medium text-xs md:text-sm text-background tracking-wide">{c.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}



function SectionHeader({ kicker, title, subtitle, link }: { kicker?: string; title: string; subtitle?: string; link?: { to: string; label: string; c?: string } }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        {kicker && <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground mb-3">{kicker}</p>}
        <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl">{subtitle}</p>}
      </div>
      {link && (
        <Link to="/colecao" search={{ c: link.c }} className="hidden md:inline text-sm font-medium text-foreground hover:text-primary underline-offset-4 hover:underline whitespace-nowrap ml-6">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

export function BestSellersSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <SectionHeader kicker="Os queridinhos da loja" title="Mais Vendidos" subtitle="As peças preferidas pelas clientes da J&S Store." link={{ to: "/colecao", label: "Ver todos", c: "mais-vendidos" }} />
        <ProductGrid sortKey="BEST_SELLING" first={8} />
      </div>
    </section>
  );
}

export function LaunchSection() {
  return (
    <section id="colecao" className="py-20 md:py-28 bg-offwhite">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <SectionHeader kicker="Acabou de chegar" title="Novidades" link={{ to: "/colecao", label: "Ver coleção", c: "novidades" }} />
        <ProductGrid sortKey="CREATED_AT" reverse first={8} />
      </div>
    </section>
  );
}

export function RecebidosHomeSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <SectionHeader kicker="Esta semana" title="Recebidos da Semana" link={{ to: "/colecao", label: "Ver lançamentos", c: "recebidos-da-semana" }} />
        <ProductGrid sortKey="CREATED_AT" reverse first={4} />
      </div>
    </section>
  );
}

export function LookbookSection() {
  return (
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-background/60">Editorial J&S Store</p>
        <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">
          Moda para o seu dia, na sua cidade.
        </h2>
        <p className="text-base text-background/75 leading-relaxed max-w-xl mx-auto">
          Há anos vestindo mulheres e homens de Joinville com peças selecionadas para o
          dia a dia, trabalho e ocasiões especiais. Atendimento próximo, curadoria honesta
          e o cuidado de uma loja física feita por gente da cidade.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 justify-center">
          <Button size="xl" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-8" asChild>
            <Link to="/colecao" search={{ c: undefined }}>Explorar coleção</Link>
          </Button>
          <Button size="xl" variant="outline" className="bg-transparent border-background text-background hover:bg-background hover:text-foreground rounded-none px-8" asChild>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Siga @{INSTAGRAM_HANDLE}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}


export function LojaFisicaSection() {
  return (
    <section id="loja" aria-labelledby="loja-titulo" className="py-20 md:py-28 bg-offwhite scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="aspect-[4/3] overflow-hidden bg-secondary order-2 md:order-1">
          <iframe
            src={STORE_INFO.mapsEmbed}
            title={`Localização ${STORE_INFO.name}`}
            loading="lazy"
            className="w-full h-full border-0"
          />
        </div>
        <div className="space-y-5 order-1 md:order-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Visite nossa loja</p>
          <h2 id="loja-titulo" className="font-display font-semibold text-3xl md:text-4xl tracking-tight">
            Loja J&S Store — Aventureiro, Joinville/SC
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-foreground shrink-0" /> {STORE_INFO.street} — {STORE_INFO.city}/{STORE_INFO.region}</p>
            <p className="flex items-start gap-2"><Clock className="h-4 w-4 mt-0.5 text-foreground shrink-0" /> Seg a Sex: 9h–18h · Sáb: 9h–13h</p>
            <p className="flex items-start gap-2"><MessageCircle className="h-4 w-4 mt-0.5 text-foreground shrink-0" /> WhatsApp: atendimento próximo e humanizado</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background rounded-none px-6" asChild>
              <a href={STORE_INFO.mapsEmbed.replace("&output=embed", "")} target="_blank" rel="noopener noreferrer">Como Chegar</a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-none px-6 border-foreground" asChild>
              <a
                href={buildWhatsAppLink("Olá! Vim pelo site e quero saber mais sobre a loja.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.whatsappClick("loja-fisica")}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DifferentialsSection() {
  return (
    <section className="py-14 md:py-16 bg-background border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {diferenciais.map(({ i: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h3 className="font-semibold text-sm">{t}</h3>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InstagramSection() {
  // Grid curada de posts recentes. Para plugar o feed real do Instagram (Graph API),
  // basta substituir "cells" por dados retornados de uma server function usando um
  // token de longa duração da Meta e mapear cada item para { image, permalink }.
  const cells: Array<{ img: string; permalink: string }> = [
    { img: CAT_IMG("camisa-gola-polo-importada"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("camiseta-peruana-branca"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("calca-jeans-masc-importada-azul-escuro"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("bermuda-sarja-lacoste"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("tshirt-feminina"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("calca-jeans-fem-azul-claro"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("short-sarja-mauricinho-reserva"), permalink: INSTAGRAM_URL },
    { img: CAT_IMG("camiseta-malha-supima"), permalink: INSTAGRAM_URL },
  ];
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground mb-3 inline-flex items-center gap-2">
            <Instagram className="h-3.5 w-3.5" strokeWidth={1.8} /> Instagram
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">
            @{INSTAGRAM_HANDLE}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-3">
            Lançamentos, bastidores e provas da semana. Toque em um post para abrir no Instagram.
          </p>
        </div>
        <div className="text-center">
          <Button
            size="lg"
            className="bg-foreground hover:bg-foreground/90 text-background rounded-none px-8"
            asChild
          >
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Seguir @{INSTAGRAM_HANDLE}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}



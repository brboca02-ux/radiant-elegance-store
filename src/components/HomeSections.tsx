import { Link } from "@tanstack/react-router";
import heroCouple from "@/assets/hero-couple.jpg.asset.json";
import catFeminino from "@/assets/cat-feminino.webp.asset.json";
import catMasculino from "@/assets/cat-masculino.webp.asset.json";
import { useSiteMedia, type SiteMediaKey } from "@/lib/api/siteMedia";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductGrid";
import { Truck, RefreshCcw, ShieldCheck, MessageCircle, MapPin, Clock, Instagram } from "lucide-react";
import { buildWhatsAppLink, STORE_INFO } from "@/lib/shopify";
import { track } from "@/lib/analytics";

export const INSTAGRAM_HANDLE = "jes.storejoinville";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

// Imagens do catálogo real, servidas pelo proxy público do storage.
const CAT_IMG = (slug: string) => `/api/public/img/catalogo/${slug}.jpg`;

const categories = [
  { label: "Feminino", alt: "Categoria Moda Feminina J&S Store", img: catFeminino.url, origin: "50% 30%", q: "feminino", mediaKey: "cat_feminino" as SiteMediaKey },
  { label: "Masculino", alt: "Categoria Moda Masculina J&S Store", img: catMasculino.url, origin: "50% 25%", q: "masculino", mediaKey: "cat_masculino" as SiteMediaKey },
];

const diferenciais = [
  { i: Truck, t: "Frete para todo Brasil", d: "Envio expresso e seguro" },
  { i: RefreshCcw, t: "Troca facilitada", d: "Até 30 dias para você decidir" },
  { i: ShieldCheck, t: "Compra segura", d: "Pagamento criptografado" },
  { i: MessageCircle, t: "Atendimento humanizado", d: "Consultoras dedicadas" },
];

export function HomeHero() {
  return (
    <section className="relative h-[50vh] min-h-[360px] md:h-[65vh] md:min-h-[460px] lg:h-[82vh] lg:min-h-[640px] overflow-hidden bg-background">
      <img
        src={heroCouple.url}
        alt="J&S Store — Moda Masculina e Feminina"
        width={1376}
        height={768}
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-left lg:object-center opacity-90"
      />
      {/* Overlay escuro concentrado na base para garantir legibilidade dos botões */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative h-full max-w-[1400px] mx-auto px-6 lg:px-16 flex items-end justify-center pb-12 md:pb-16 lg:pb-20">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            size="xl"
            className="bg-gold hover:bg-gold/90 text-primary-foreground rounded-none px-7 lg:px-10 font-semibold shadow-lg"
            asChild
          >
            <Link to="/colecao" search={{ c: "feminino" }}>Comprar Feminino</Link>
          </Button>
          <Button
            size="xl"
            variant="outline"
            className="bg-transparent border-gold text-gold hover:bg-gold hover:text-primary-foreground rounded-none px-7 lg:px-10 font-semibold shadow-lg"
            asChild
          >
            <Link to="/colecao" search={{ c: "masculino" }}>Comprar Masculino</Link>
          </Button>
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
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {categories.map((c) => (
            <Link
              key={c.label}
              to="/colecao"
              search={{ c: c.q }}
              className="group relative h-[85px] md:h-[130px] overflow-hidden bg-secondary"
            >
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                style={{ transformOrigin: c.origin }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-sm md:text-lg text-gold tracking-tight uppercase">
                    {c.label}
                  </h3>
                  <p className="hidden md:block text-[9px] text-white/80 font-medium tracking-[0.2em] uppercase opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    Ver coleção →
                  </p>
                </div>
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
    <section id="colecao" className="py-20 md:py-28 bg-background">
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
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-foreground/60">Editorial J&S Store</p>
        <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">
          Moda para o seu dia, na sua cidade.
        </h2>
        <p className="text-base text-foreground/75 leading-relaxed max-w-xl mx-auto">
          Há anos vestindo mulheres e homens de Joinville com peças selecionadas para o
          dia a dia, trabalho e ocasiões especiais. Atendimento próximo, curadoria honesta
          e o cuidado de uma loja física feita por gente da cidade.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 justify-center">
          <Button size="xl" className="bg-gold hover:bg-gold/90 text-primary-foreground rounded-none px-8" asChild>
            <Link to="/colecao" search={{ c: undefined }}>Explorar coleção</Link>
          </Button>
          <Button size="xl" variant="outline" className="bg-transparent border-gold text-gold hover:bg-gold hover:text-primary-foreground rounded-none px-8" asChild>
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
    <section id="loja" aria-labelledby="loja-titulo" className="py-20 md:py-28 bg-background scroll-mt-24">
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



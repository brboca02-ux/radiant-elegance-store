import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import vestidos from "@/assets/cat-vestidos.jpg";
import conjuntos from "@/assets/cat-conjuntos.jpg";
import blazers from "@/assets/cat-blazers.jpg";
import alfaiataria from "@/assets/cat-alfaiataria.jpg";
import tricots from "@/assets/cat-tricots.jpg";
import novidades from "@/assets/cat-novidades.jpg";
import lookbook1 from "@/assets/lookbook-1.jpg";
import lookbook2 from "@/assets/lookbook-2.jpg";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductGrid";
import { Truck, RefreshCcw, ShieldCheck, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/shopify";
import { useSiteConfig } from "@/lib/siteConfig";
import { track } from "@/lib/analytics";


const categories = [
  { label: "Feminino", img: vestidos, q: "feminino" },
  { label: "Masculino", img: blazers, q: "masculino" },
  { label: "Vestidos", img: novidades, q: "vestidos" },
  { label: "Conjuntos", img: conjuntos, q: "conjuntos" },
  { label: "Plus Size", img: alfaiataria, q: "plus-size" },
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
    <section className="relative h-[78vh] min-h-[560px] md:min-h-[680px] overflow-hidden bg-foreground">
      <img
        src={hero}
        alt="MD Modas — Nova Coleção"
        width={1920}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
      <div className="relative h-full max-w-[1400px] mx-auto px-6 lg:px-16 flex items-center">
        <div className="max-w-2xl text-background">
          <h1 className="font-display font-semibold text-5xl md:text-7xl leading-[1.02] text-background tracking-tight">
            MD Modas
          </h1>
          <p className="text-lg md:text-xl text-background/90 mt-6 leading-relaxed font-light max-w-lg">
            {cfg.heroSubtitle || "Moda feminina e masculina para todas as ocasiões."}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="xl" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-8 font-semibold" asChild>
              <Link to="/colecao" search={{ c: "feminino" }}>Comprar Feminino</Link>
            </Button>
            <Button size="xl" variant="outline" className="bg-transparent border-background text-background hover:bg-background hover:text-foreground rounded-none px-8 font-semibold" asChild>
              <Link to="/colecao" search={{ c: "masculino" }}>Comprar Masculino</Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}


export function CategoriesSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">Categorias</h2>
            <p className="text-sm text-muted-foreground mt-2">Encontre o que combina com você.</p>
          </div>
          <Link to="/colecao" search={{ c: undefined }} className="hidden md:inline text-sm font-medium text-primary hover:underline">
            Ver tudo →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {categories.map((c) => (
            <Link
              key={c.label}
              to="/colecao"
              search={{ c: c.q }}
              className="group relative aspect-[3/4] overflow-hidden bg-secondary"
            >
              <img src={c.img} alt={c.label} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-display font-semibold text-lg md:text-xl text-background">{c.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


function SectionHeader({ kicker, title, link }: { kicker?: string; title: string; link?: { to: string; label: string; c?: string } }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        {kicker && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">{kicker}</p>}
        <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link to="/colecao" search={{ c: link.c }} className="hidden md:inline text-sm font-medium text-foreground hover:text-primary underline-offset-4 hover:underline">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

export function LaunchSection() {
  return (
    <section id="colecao" className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <SectionHeader kicker="Novidades" title="Recém-chegados" link={{ to: "/colecao", label: "Ver coleção", c: "novidades" }} />
        <ProductGrid sortKey="CREATED_AT" reverse first={8} />
      </div>
    </section>
  );
}

export function BestSellersSection() {
  return (
    <section className="py-20 md:py-28 bg-offwhite">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <SectionHeader kicker="Os queridinhos" title="Mais Vendidos" link={{ to: "/colecao", label: "Ver todos", c: "mais-vendidos" }} />
        <ProductGrid sortKey="BEST_SELLING" first={8} />
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
    <section className="py-20 md:py-28 bg-foreground text-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="aspect-[4/5] overflow-hidden">
          <img src={lookbook1} alt="Editorial MD Modas" loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Editorial</p>
          <h2 className="font-display font-semibold text-3xl md:text-5xl leading-tight">Vestindo o seu dia a dia, com atitude.</h2>
          <p className="text-base text-background/70 leading-relaxed max-w-md">
            Peças versáteis para mulheres e homens reais. Tecidos confortáveis, caimento perfeito e curadoria pensada para você.
          </p>
          <Button size="xl" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-8" asChild>
            <Link to="/colecao" search={{ c: undefined }}>Explorar coleção</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function DifferentialsSection() {
  return (
    <section className="py-14 md:py-16 bg-offwhite border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {diferenciais.map(({ i: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-3">
            <Icon className="h-6 w-6 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
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
  const cells = [vestidos, conjuntos, blazers, alfaiataria, tricots, novidades, lookbook1, lookbook2];
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">Instagram</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">@mdmodas</h2>
          </div>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hidden md:inline text-sm font-medium hover:text-primary underline-offset-4 hover:underline">
            Seguir →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {cells.map((src, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden bg-secondary">
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}


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
              <Link to="/colecao" search={{ c: undefined }}>Comprar Agora</Link>
            </Button>
            <Button size="xl" variant="outline" className="bg-transparent border-background text-background hover:bg-background hover:text-foreground rounded-none px-8 font-semibold" asChild>
              <a
                href={buildWhatsAppLink("Olá! Vim pelo site da MD Modas e gostaria de ajuda.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.whatsappClick("hero")}
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


export function LaunchSection() {
  return (
    <section id="colecao" className="py-24 bg-offwhite">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <span className="eyebrow">Em destaque</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Lançamentos</h2>
          <span className="gold-rule mt-5" />
        </div>
        <ProductGrid />
      </div>
    </section>
  );
}

export function LookbookSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="aspect-[3/4] overflow-hidden bg-secondary">
          <img src={lookbook1} alt="Lookbook" loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-8 md:pl-8">
          <span className="eyebrow">Lookbook</span>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">A elegância em sua forma mais pura.</h2>
          <span className="gold-rule" />
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">
            Uma curadoria de peças atemporais, criadas para mulheres que entendem o silêncio do luxo. Cada detalhe pensado para vestir, durar e encantar.
          </p>
          <div className="aspect-[3/2] overflow-hidden bg-secondary">
            <img src={lookbook2} alt="Detalhe de tecido" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <Button variant="default" size="xl" asChild><a href="#colecao">Comprar o Look</a></Button>
        </div>
      </div>
    </section>
  );
}

export function DifferentialsSection() {
  return (
    <section className="py-20 bg-offwhite border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-10">
        {diferenciais.map(({ i: Icon, t, d }) => (
          <div key={t} className="text-center">
            <Icon className="mx-auto h-7 w-7 text-gold" strokeWidth={1.25} />
            <h3 className="font-display text-lg mt-4">{t}</h3>
            <p className="text-xs text-muted-foreground mt-2 tracking-wide">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InstagramSection() {
  const cells = [vestidos, conjuntos, blazers, alfaiataria, tricots, novidades, lookbook1, lookbook2];
  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <span className="eyebrow">@aura.boutique</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Inspire-se</h2>
          <span className="gold-rule mt-5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {cells.map((src, i) => (
            <a key={i} href="#" className="group relative aspect-square overflow-hidden bg-secondary">
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

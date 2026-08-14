import { createFileRoute } from "@tanstack/react-router";
import {
  HomeHero,
  CategoriesSection,
  RecebidosHomeSection,
  LookbookSection,
  LojaFisicaSection,
  DifferentialsSection,
  InstagramSection,
} from "@/components/HomeSections";
import { ShowcaseCarousel } from "@/components/ShowcaseCarousel";
import { NewsletterSection } from "@/components/NewsletterCapture";
import heroCouple from "@/assets/hero-couple.jpg.asset.json?url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J&S Store — Loja de Moda no Aventureiro, Joinville/SC" },
      { name: "description", content: "J&S Store: moda masculina e feminina em Joinville (Aventureiro). Camisas polo, camisetas peruanas, bermudas de sarja e calças jeans importadas." },
      { name: "keywords", content: "moda em Joinville, loja de roupas Aventureiro, moda masculina Joinville, moda feminina Joinville, J&S Store, camisa polo importada, calça jeans importada" },
      { name: "geo.region", content: "BR-SC" },
      { name: "geo.placename", content: "Joinville" },
      { name: "geo.position", content: "-26.2543;-48.8112" },
      { name: "ICBM", content: "-26.2543, -48.8112" },
      { property: "og:title", content: "J&S Store — Moda em Joinville (Aventureiro)" },
      { property: "og:description", content: "Loja física no Aventureiro e loja online. Curadoria feminina e masculina, atendimento pelo WhatsApp e entrega para toda a região." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://jsstore.lovable.app/" },
      { property: "og:locale", content: "pt_BR" },
    ],
    links: [
      { rel: "canonical", href: "https://jsstore.lovable.app/" },
      // Preload LCP hero
      { rel: "preload", as: "image", href: heroCouple, fetchPriority: "high" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HomeHero />
      <CategoriesSection />
      <ShowcaseCarousel />
      <RecebidosHomeSection />
      <LookbookSection />
      <LojaFisicaSection />
      <DifferentialsSection />
      <InstagramSection />
      <NewsletterSection />
    </>
  );
}

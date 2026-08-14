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
      { title: "J&S Store — Moda Masculina e Feminina em Joinville/SC" },
      { name: "description", content: "J&S Store: moda masculina e feminina em Joinville (Aventureiro). Camisas polo, camisetas peruanas, calças jeans e bermudas de sarja." },
      { name: "keywords", content: "moda em Joinville, loja de roupas Aventureiro, moda masculina Joinville, moda feminina Joinville, J&S Store" },
      { name: "geo.region", content: "BR-SC" },
      { name: "geo.placename", content: "Joinville" },
      { property: "og:title", content: "J&S Store — Moda em Joinville (Aventureiro)" },
      { property: "og:description", content: "Curadoria feminina e masculina, atendimento pelo WhatsApp e entrega para toda a região." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://jsstore.lovable.app/" },
      { property: "og:locale", content: "pt_BR" },
    ],
    links: [
      { rel: "canonical", href: "https://jsstore.lovable.app/" },
      // Preload LCP hero with high priority
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

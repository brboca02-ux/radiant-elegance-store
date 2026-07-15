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
import { NewsletterSection } from "@/components/NewsletterCapture";
import heroDesktop from "@/assets/hero.jpg?url";
import heroMobile from "@/assets/hero-mobile.jpg?url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MD Modas — Loja de Moda no Aventureiro, Joinville/SC" },
      { name: "description", content: "MD Modas: moda feminina e masculina em Joinville (Aventureiro). Vestidos, plus size, calçados e novidades toda semana." },
      { name: "keywords", content: "moda em Joinville, loja de roupas Aventureiro, moda feminina Joinville, moda masculina Joinville, MD Modas, plus size Joinville" },
      { name: "geo.region", content: "BR-SC" },
      { name: "geo.placename", content: "Joinville" },
      { name: "geo.position", content: "-26.2543;-48.8112" },
      { name: "ICBM", content: "-26.2543, -48.8112" },
      { property: "og:title", content: "MD Modas — Moda em Joinville (Aventureiro)" },
      { property: "og:description", content: "Loja física no Aventureiro e loja online. Curadoria feminina e masculina, atendimento pelo WhatsApp e entrega para toda a região." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mdmodas.lovable.app/" },
      { property: "og:locale", content: "pt_BR" },
    ],
    links: [
      { rel: "canonical", href: "https://mdmodas.lovable.app/" },
      // Preload LCP hero — variante por viewport
      { rel: "preload", as: "image", href: heroMobile, fetchPriority: "high", media: "(max-width: 1023px)" },
      { rel: "preload", as: "image", href: heroDesktop, fetchPriority: "high", media: "(min-width: 1024px)" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HomeHero />
      <CategoriesSection />
      <RecebidosHomeSection />
      <LookbookSection />
      <LojaFisicaSection />
      <DifferentialsSection />
      <InstagramSection />
      <NewsletterSection />
    </>
  );
}

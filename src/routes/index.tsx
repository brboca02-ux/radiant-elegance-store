import { createFileRoute } from "@tanstack/react-router";
import {
  HomeHero,
  CategoriesSection,
  LaunchSection,
  LookbookSection,
  DifferentialsSection,
  InstagramSection,
} from "@/components/HomeSections";
import { PromoCountdownBanner, RecebidosSection } from "@/components/PromoSections";
import { NewsletterSection } from "@/components/NewsletterCapture";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MD Modas — Moda Feminina e Masculina em Joinville" },
      { name: "description", content: "MD Modas: moda feminina e masculina em Joinville. Vestidos, conjuntos, plus size e novidades toda semana. Compre pelo WhatsApp." },
      { property: "og:title", content: "MD Modas — Moda em Joinville" },
      { property: "og:description", content: "Vestidos, conjuntos, plus size e novidades. Compre pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HomeHero />
      <PromoCountdownBanner />
      <CategoriesSection />
      <RecebidosSection />
      <LaunchSection />
      <WhatsAppCTA source="home" />
      <LookbookSection />
      <DifferentialsSection />
      <NewsletterSection />
      <InstagramSection />
    </>
  );
}

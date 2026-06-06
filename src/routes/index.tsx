import { createFileRoute } from "@tanstack/react-router";
import {
  HomeHero,
  CategoriesSection,
  LaunchSection,
  LookbookSection,
  DifferentialsSection,
  InstagramSection,
} from "@/components/HomeSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MD Modas — Moda Feminina e Masculina" },
      { name: "description", content: "MD Modas: moda feminina e masculina para todas as ocasiões. Vestidos, conjuntos, plus size e novidades toda semana. Compre pelo WhatsApp." },
      { property: "og:title", content: "MD Modas — Moda Feminina e Masculina" },
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
      <CategoriesSection />
      <LaunchSection />
      <LookbookSection />
      <DifferentialsSection />
      <InstagramSection />
    </>
  );
}

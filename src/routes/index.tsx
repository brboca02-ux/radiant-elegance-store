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
      { title: "Aura Boutique — Moda Feminina Sofisticada" },
      { name: "description", content: "Coleções premium de vestidos, conjuntos, alfaiataria e tricots. Elegância, conforto e exclusividade para a mulher contemporânea." },
      { property: "og:title", content: "Aura Boutique — Moda Feminina Sofisticada" },
      { property: "og:description", content: "Coleções premium de vestidos, conjuntos, alfaiataria e tricots." },
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

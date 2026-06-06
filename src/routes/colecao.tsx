import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { ProductGrid } from "@/components/ProductGrid";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/colecao")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Coleção — Aura Boutique" },
      { name: "description", content: "Explore toda a coleção Aura: vestidos, conjuntos, blazers, alfaiataria e tricots." },
      { property: "og:title", content: "Coleção — Aura Boutique" },
      { property: "og:description", content: "Explore toda a coleção Aura." },
      { property: "og:url", content: "/colecao" },
    ],
    links: [{ rel: "canonical", href: "/colecao" }],
  }),
  component: ColecaoPage,
});

function ColecaoPage() {
  const { c } = Route.useSearch();
  const title = c ? c.charAt(0).toUpperCase() + c.slice(1) : "Toda a Coleção";
  return (
    <div className="bg-background">
      <div className="bg-offwhite py-16 border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <span className="eyebrow">Coleção</span>
          <h1 className="font-display text-4xl md:text-6xl mt-3">{title}</h1>
          <span className="gold-rule mt-5" />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <ProductGrid query={c ? `tag:${c} OR product_type:${c} OR title:${c}` : undefined} />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductGrid";
import { CATEGORIES } from "@/stores/productsStore";

interface ColecaoSearch { c?: string }

function sanitizeTerm(input: string) {
  return input.slice(0, 80).replace(/["\\():*?]/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/colecao")({
  validateSearch: (search: Record<string, unknown>): ColecaoSearch => ({
    c: typeof search.c === "string" ? search.c.slice(0, 80) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Coleção — MD Modas" },
      { name: "description", content: "Explore toda a coleção MD Modas: vestidos, conjuntos, blazers, plus size e novidades." },
      { property: "og:title", content: "Coleção — MD Modas" },
      { property: "og:description", content: "Explore toda a coleção MD Modas." },
      { property: "og:url", content: "/colecao" },
    ],
    links: [{ rel: "canonical", href: "/colecao" }],
  }),
  component: ColecaoPage,
});

function ColecaoPage() {
  const { c } = Route.useSearch();
  const safe = c ? sanitizeTerm(c) : "";
  const activeCat = CATEGORIES.find((cat) => cat.id === safe);
  const title = activeCat ? activeCat.name : safe ? safe.charAt(0).toUpperCase() + safe.slice(1) : "Toda a Coleção";
  const query = safe ? `tag:${safe} OR product_type:${safe} OR title:*${safe}*` : undefined;

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-background text-foreground border-border hover:border-foreground"
    }`;

  return (
    <div className="bg-background">
      <div className="bg-offwhite py-16 border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <span className="eyebrow">Coleção</span>
          <h1 className="font-display text-4xl md:text-6xl mt-3">{title}</h1>
          <span className="gold-rule mt-5" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-8">
        <nav aria-label="Filtrar por categoria" className="flex flex-wrap gap-2 justify-center">
          <Link to="/colecao" search={{}} className={chip(!safe)}>
            Todos
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/colecao"
              search={{ c: cat.id }}
              className={chip(safe === cat.id)}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <ProductGrid query={query} />
      </div>
    </div>
  );
}

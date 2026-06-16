import { useQuery } from "@tanstack/react-query";
import { PRODUCTS_QUERY, storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { getMockShopifyProducts } from "@/lib/mockProducts";
import { ProductCard } from "./ProductCard";

interface FetchOpts {
  query?: string;
  first?: number;
  sortKey?: "CREATED_AT" | "BEST_SELLING" | "PRICE" | "TITLE" | "UPDATED_AT" | "RELEVANCE";
  reverse?: boolean;
}

async function fetchProducts({ query, first = 12, sortKey, reverse }: FetchOpts): Promise<ShopifyProduct[]> {
  try {
    const data = await storefrontApiRequest(PRODUCTS_QUERY, {
      first,
      query: query ?? null,
      sortKey: sortKey ?? null,
      reverse: reverse ?? null,
    });
    const edges = (data?.data?.products?.edges ?? []) as ShopifyProduct[];
    if (edges.length > 0) return edges;
  } catch {
    // fallback abaixo
  }
  // Fallback: vitrine usa fotos mocadas do catálogo local quando o Shopify n\u00e3o retorna.
  return getMockShopifyProducts({ query, first });
}

export function ProductGrid({
  query,
  first,
  sortKey,
  reverse,
  emptyHint = true,
}: { query?: string; first?: number; sortKey?: FetchOpts["sortKey"]; reverse?: boolean; emptyHint?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["products", query ?? "all", first ?? 12, sortKey ?? "default", reverse ?? false],
    queryFn: () => fetchProducts({ query, first, sortKey, reverse }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-md bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyHint ? (
      <div className="py-16 text-center border border-dashed border-border rounded-md">
        <p className="font-display text-2xl mb-2">
          {query ? "Nenhum produto encontrado" : "Coleção em preparação"}
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
          {query ? "Tente outro termo, categoria ou cor." : "Em breve novidades. Volte mais tarde ou fale com a gente no WhatsApp."}
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 items-stretch">
      {data.map((p) => (
        <div key={p.node.id} className="flex">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

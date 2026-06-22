import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PRODUCTS_QUERY, storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { useProductsStore } from "@/stores/productsStore";
import { productToShopify } from "@/lib/mockProducts";
import { ProductCard } from "./ProductCard";

interface FetchOpts {
  query?: string;
  first?: number;
  sortKey?: "CREATED_AT" | "BEST_SELLING" | "PRICE" | "TITLE" | "UPDATED_AT" | "RELEVANCE";
  reverse?: boolean;
}

async function fetchShopify({ query, first = 12, sortKey, reverse }: FetchOpts): Promise<ShopifyProduct[]> {
  try {
    const data = await storefrontApiRequest(PRODUCTS_QUERY, {
      first, query: query ?? null,
      sortKey: sortKey ?? null, reverse: reverse ?? null,
    });
    return (data?.data?.products?.edges ?? []) as ShopifyProduct[];
  } catch {
    return [];
  }
}

export function ProductGrid({
  query, first = 12, sortKey, reverse, emptyHint = true,
}: { query?: string; first?: number; sortKey?: FetchOpts["sortKey"]; reverse?: boolean; emptyHint?: boolean }) {
  // Fonte primária: Supabase (via store). Reativo: re-renderiza ao hidratar/CRUD.
  const products = useProductsStore((s) => s.products);
  const loading = useProductsStore((s) => s.loading);
  const loaded = useProductsStore((s) => s.loaded);

  // Shopify só como reforço opcional (vazio se loja sem plano).
  const { data: shopifyData } = useQuery({
    queryKey: ["shopify-products", query ?? "all", first, sortKey ?? "default", reverse ?? false],
    queryFn: () => fetchShopify({ query, first, sortKey, reverse }),
    staleTime: 60_000,
  });

  const items = useMemo<ShopifyProduct[]>(() => {
    const q = (query ?? "").toLowerCase();
    const active = products.filter((p) => p.status === "ativo");
    let filtered = q
      ? active.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category_id.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q),
        )
      : active;

    if (sortKey === "CREATED_AT") {
      filtered = [...filtered].sort((a, b) => (reverse ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)));
    } else if (sortKey === "PRICE") {
      filtered = [...filtered].sort((a, b) => (reverse ? b.price - a.price : a.price - b.price));
    } else if (sortKey === "TITLE") {
      filtered = [...filtered].sort((a, b) => (reverse ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    }

    const fromSupabase = filtered.slice(0, first).map(productToShopify);
    if (fromSupabase.length > 0) return fromSupabase;
    return shopifyData ?? [];
  }, [products, query, first, sortKey, reverse, shopifyData]);

  if ((!loaded && loading) || (!loaded && items.length === 0)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-md bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
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
      {items.map((p) => (
        <div key={p.node.id} className="flex">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

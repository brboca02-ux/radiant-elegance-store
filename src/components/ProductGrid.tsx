import { useQuery } from "@tanstack/react-query";
import { PRODUCTS_QUERY, storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "./ProductCard";

async function fetchProducts(query?: string) {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 12, query: query ?? null });
  return (data?.data?.products?.edges ?? []) as ShopifyProduct[];
}

export function ProductGrid({ query, emptyHint = true }: { query?: string; emptyHint?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["products", query ?? "all"],
    queryFn: () => fetchProducts(query),
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
        <p className="font-display text-2xl mb-2">Coleção em preparação</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
          Nenhum produto encontrado. Adicione produtos à sua loja Shopify para vê-los aparecer aqui automaticamente.
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

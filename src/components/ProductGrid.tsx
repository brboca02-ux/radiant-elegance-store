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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyHint ? (
      <div className="py-16 text-center border border-dashed border-border">
        <p className="font-display text-2xl mb-2">Coleção em preparação</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Nenhum produto encontrado. Adicione produtos à sua loja Shopify para vê-los aparecer aqui automaticamente.
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {data.map((p) => <ProductCard key={p.node.id} product={p} />)}
    </div>
  );
}

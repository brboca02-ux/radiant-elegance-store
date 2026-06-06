import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const img0 = product.node.images.edges[0]?.node;
  const img1 = product.node.images.edges[1]?.node ?? img0;
  const price = product.node.priceRange.minVariantPrice;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
  };

  return (
    <Link
      to="/produto/$handle"
      params={{ handle: product.node.handle }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {img0 && (
          <img
            src={img0.url}
            alt={img0.altText ?? product.node.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
        )}
        {img1 && (
          <img
            src={img1.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[1200ms] ease-out group-hover:scale-100"
          />
        )}
        <button
          onClick={onAdd}
          disabled={isLoading || !variant}
          className="absolute bottom-0 inset-x-0 bg-foreground text-background text-[11px] tracking-[0.25em] uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Comprar"}
        </button>
      </div>
      <div className="pt-4 text-center">
        <h3 className="font-display text-base">{product.node.title}</h3>
        <p className="text-sm mt-1 text-muted-foreground">{formatPrice(price.amount, price.currencyCode)}</p>
      </div>
    </Link>
  );
}

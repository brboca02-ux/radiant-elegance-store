import { Link } from "@tanstack/react-router";
import { Loader2, ImageOff } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { buildSrcSet, CARD_SIZES, BLUR_PLACEHOLDER } from "@/lib/image";
import { track } from "@/lib/analytics";



export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [loaded0, setLoaded0] = useState(false);
  const [loaded1, setLoaded1] = useState(false);
  const variant = product.node.variants.edges[0]?.node;

  const img0 = product.node.images.edges[0]?.node;
  const img1 = product.node.images.edges[1]?.node ?? img0;
  const price = product.node.priceRange.minVariantPrice;
  const soldOut = !variant?.availableForSale;
  const lowStock =
    typeof variant?.quantityAvailable === "number" &&
    variant.quantityAvailable > 0 &&
    variant.quantityAvailable <= 3;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant || soldOut) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
    track.addToCart({
      id: product.node.id,
      name: product.node.title,
      price: parseFloat(variant.price.amount),
      currency: variant.price.currencyCode,
    });
  };


  return (
    <Link
      to="/produto/$handle"
      params={{ handle: product.node.handle }}
      aria-label={`Ver detalhes de ${product.node.title}`}
      className="group flex h-full w-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-secondary">
        {img0 ? (
          <>
            {!loaded0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary animate-pulse" />
            )}
            <img
              src={img0.url}
              alt={img0.altText ?? product.node.title}
              loading="lazy"
              decoding="async"
              width={600}
              height={800}
              onLoad={() => setLoaded0(true)}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 group-hover:opacity-0 ${loaded0 ? "opacity-100" : "opacity-0"}`}
            />
            {img1 && (
              <img
                src={img1.url}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                width={600}
                height={800}
                onLoad={() => setLoaded1(true)}
                className={`absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[1200ms] ease-out group-hover:scale-100 ${loaded1 ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </>

        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8 mb-2" />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}

        {soldOut && (
          <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded">
            Esgotado
          </span>
        )}
        {!soldOut && lowStock && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded">
            Últimas peças
          </span>
        )}

        <button
          onClick={onAdd}
          disabled={isLoading || !variant || soldOut}
          aria-label={soldOut ? "Produto esgotado" : `Comprar ${product.node.title}`}
          className="absolute bottom-0 inset-x-0 bg-foreground text-background text-[11px] tracking-[0.25em] uppercase py-3 translate-y-full group-hover:translate-y-0 focus-visible:translate-y-0 transition-transform duration-500 flex items-center justify-center disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : soldOut ? "Esgotado" : "Comprar"}
        </button>
      </div>
      <div className="flex flex-1 flex-col pt-3 text-center">
        <h3 className="font-display text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.6em]">
          {product.node.title}
        </h3>
        <p className="text-sm sm:text-[15px] mt-auto pt-2 font-semibold text-foreground">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      </div>
    </Link>
  );
}

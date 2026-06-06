import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice, PRODUCT_BY_HANDLE_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/produto/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Aura Boutique` },
      { name: "description", content: `Produto Aura Boutique: ${params.handle}` },
      { property: "og:title", content: `${params.handle} — Aura Boutique` },
      { property: "og:url", content: `/produto/${params.handle}` },
    ],
    links: [{ rel: "canonical", href: `/produto/${params.handle}` }],
  }),
  component: ProductPage,
});

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: { edges: Array<{ node: { id: string; title: string; price: { amount: string; currencyCode: string }; availableForSale: boolean; selectedOptions: Array<{ name: string; value: string }> } }> };
  options: Array<{ name: string; values: string[] }>;
}

function ProductPage() {
  const { handle } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["product", handle],
    queryFn: async () => {
      const r = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      const p = r?.data?.product as ProductDetail | null;
      if (!p) throw notFound();
      return p;
    },
  });
  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [variantIdx, setVariantIdx] = useState(0);

  if (isLoading || !data) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const variants = data.variants.edges.map((e) => e.node);
  const selected = variants[variantIdx] ?? variants[0];
  const images = data.images.edges.map((e) => e.node);

  const handleAdd = async () => {
    if (!selected) return;
    await addItem({
      product: { node: { ...data } } as never,
      variantId: selected.id,
      variantTitle: selected.title,
      price: selected.price,
      quantity: 1,
      selectedOptions: selected.selectedOptions,
    });
  };

  return (
    <div className="bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-2 gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {images.map((img, i) => (
            <div key={i} className={`bg-secondary overflow-hidden ${i === 0 ? "md:col-span-2 aspect-[4/5]" : "aspect-square"}`}>
              <img src={img.url} alt={img.altText ?? data.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          ))}
        </div>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <span className="eyebrow">Aura · Coleção</span>
          <h1 className="font-display text-4xl md:text-5xl mt-3">{data.title}</h1>
          <span className="gold-rule mt-4" />
          <div className="mt-6">
            <p className="text-2xl">{formatPrice(selected.price.amount, selected.price.currencyCode)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ou 4x de {formatPrice(parseFloat(selected.price.amount) / 4, selected.price.currencyCode)} sem juros · <span className="text-gold">10% off no Pix</span>
            </p>
          </div>
          {variants.length > 1 && (
            <div className="mt-8">
              <p className="text-[11px] tracking-[0.25em] uppercase mb-3">Selecione: <span className="text-muted-foreground">{selected.title}</span></p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantIdx(i)}
                    disabled={!v.availableForSale}
                    className={`min-w-12 h-11 px-3 text-sm border transition ${i === variantIdx ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"} ${!v.availableForSale ? "opacity-40 line-through" : ""}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 space-y-3">
            <Button onClick={handleAdd} disabled={isAdding} size="xl" variant="default" className="w-full">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar à Sacola"}
            </Button>
            <Button asChild size="xl" variant="gold" className="w-full">
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">Comprar pelo WhatsApp</a>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground leading-relaxed">{data.description}</p>
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border text-center">
            <div><Truck className="mx-auto h-5 w-5 text-gold" strokeWidth={1.25} /><p className="text-[10px] tracking-widest uppercase mt-2">Frete Brasil</p></div>
            <div><RefreshCcw className="mx-auto h-5 w-5 text-gold" strokeWidth={1.25} /><p className="text-[10px] tracking-widest uppercase mt-2">Troca fácil</p></div>
            <div><ShieldCheck className="mx-auto h-5 w-5 text-gold" strokeWidth={1.25} /><p className="text-[10px] tracking-widest uppercase mt-2">Site seguro</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

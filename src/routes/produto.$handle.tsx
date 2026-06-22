import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";

import { Button } from "@/components/ui/button";
import { formatPrice, STORE_INFO, buildWhatsAppLink } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useProductsStore } from "@/stores/productsStore";
import { productToShopify } from "@/lib/mockProducts";
import { Loader2, ShieldCheck, Truck, RefreshCcw, MapPin, MessageCircle, Flame, X, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/produto/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — MD Modas Joinville` },
      { name: "description", content: `Compre ${params.handle} na MD Modas. Moda em Joinville, atendimento pelo WhatsApp e entrega para toda a região.` },
      { property: "og:title", content: `${params.handle} — MD Modas` },
      { property: "og:url", content: `/produto/${params.handle}` },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: `/produto/${params.handle}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const products = useProductsStore((s) => s.products);
  const loaded = useProductsStore((s) => s.loaded);
  const loading = useProductsStore((s) => s.loading);

  const product = useMemo(() => products.find((p) => p.slug === handle), [products, handle]);
  const data = useMemo(() => (product ? productToShopify(product).node : null), [product]);

  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [variantIdx, setVariantIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);


  useEffect(() => {
    if (data) {
      const variants = data.variants.edges.map((e) => e.node);
      const selected = variants[0];
      if (selected) {
        track.viewItem({
          id: data.id, name: data.title,
          price: parseFloat(selected.price.amount),
          currency: selected.price.currencyCode,
        });
      }
    }
  }, [data?.id]); // eslint-disable-line

  if (loading || (!loaded && !product)) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (loaded && !product) throw notFound();
  if (!data) return null;

  const variants = data.variants.edges.map((e) => e.node);
  const selected = variants[variantIdx] ?? variants[0];
  const images = data.images.edges.map((e) => e.node);

  const lowStock =
    typeof selected?.quantityAvailable === "number" &&
    selected.quantityAvailable > 0 &&
    selected.quantityAvailable <= 3;

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

  const productUrl = typeof window !== "undefined" ? window.location.href : `/produto/${handle}`;
  const optionsText = selected?.selectedOptions?.length
    ? selected.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", ") : "";
  const priceText = selected ? formatPrice(selected.price.amount, selected.price.currencyCode) : "";
  const waMessage = [
    `Olá! Tenho interesse no produto *${data.title}*`,
    optionsText && `(${optionsText})`,
    priceText && `— ${priceText}.`,
    `Poderia me ajudar?`,
    productUrl,
  ].filter(Boolean).join(" ");
  const waLink = buildWhatsAppLink(waMessage);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.title,
    description: data.description,
    image: images.map((i) => i.url),
    sku: selected?.id,
    brand: { "@type": "Brand", name: "MD Modas" },
    offers: {
      "@type": "Offer",
      priceCurrency: selected?.price.currencyCode ?? "BRL",
      price: selected?.price.amount,
      availability: selected?.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {images.map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setLightboxIdx(i)}
              aria-label={`Ampliar imagem ${i + 1}`}
              className={`bg-secondary overflow-hidden rounded-md group ${i === 0 ? "md:col-span-2 aspect-[4/5]" : "aspect-square"}`}
            >
              <img src={img.url} alt={img.altText ?? data.title} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-700" />
            </button>
          ))}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">MD Modas</span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-3">{data.title}</h1>
          <div className="mt-5">
            <p className="text-3xl font-bold text-primary">{formatPrice(selected.price.amount, selected.price.currencyCode)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ou 4x de {formatPrice(parseFloat(selected.price.amount) / 4, selected.price.currencyCode)} sem juros · <span className="text-[#D4AF37] font-semibold">10% off no Pix</span>
            </p>
            {lowStock && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Flame className="h-3.5 w-3.5" /> Últimas {selected.quantityAvailable} peças
              </p>
            )}
          </div>
          {variants.length > 1 && (
            <div className="mt-7">
              <p className="text-sm font-semibold mb-3">Selecione: <span className="text-muted-foreground font-normal">{selected.title}</span></p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantIdx(i)}
                    disabled={!v.availableForSale}
                    className={`min-w-12 h-12 px-4 text-sm rounded-full border-2 transition ${i === variantIdx ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"} ${!v.availableForSale ? "opacity-40 line-through" : ""}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-7 space-y-3">
            <Button onClick={handleAdd} disabled={isAdding} size="xl" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "🛒 Adicionar à Sacola"}
            </Button>
            <Button asChild size="xl" className="w-full rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white h-14 text-base">
              <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => track.whatsappClick("product")}>
                <MessageCircle className="w-5 h-5 mr-2" /> Comprar pelo WhatsApp
              </a>
            </Button>
          </div>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Loja física em {STORE_INFO.city}</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Atendimento pelo WhatsApp</li>
            <li className="flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-primary" /> Troca facilitada</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Compra segura</li>
          </ul>

          <p className="mt-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.description}</p>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border text-center">
            <div><Truck className="mx-auto h-5 w-5 text-primary" /><p className="text-xs mt-2">Entrega na região</p></div>
            <div><RefreshCcw className="mx-auto h-5 w-5 text-primary" /><p className="text-xs mt-2">Troca fácil</p></div>
            <div><ShieldCheck className="mx-auto h-5 w-5 text-primary" /><p className="text-xs mt-2">Site seguro</p></div>
          </div>
        </div>
      </div>

      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                aria-label="Anterior"
                className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                aria-label="Próxima"
                className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={images[lightboxIdx].url}
            alt={images[lightboxIdx].altText ?? data.title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}


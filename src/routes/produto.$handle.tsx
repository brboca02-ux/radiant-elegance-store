import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice, PRODUCT_BY_HANDLE_QUERY, storefrontApiRequest } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ShieldCheck, Truck, RefreshCcw, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5500000000000"; // troque pelo número real da loja

export const Route = createFileRoute("/produto/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — MD Modas Joinville` },
      { name: "description", content: `Compre ${params.handle} na MD Modas. Moda feminina e masculina em Joinville, atendimento pelo WhatsApp e entrega para toda a região.` },
      { property: "og:title", content: `${params.handle} — MD Modas` },
      { property: "og:url", content: `/produto/${params.handle}` },
      { property: "og:type", content: "product" },
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

  // WhatsApp com mensagem pré-preenchida (nome, opções, preço, link)
  const productUrl = typeof window !== "undefined" ? window.location.href : `/produto/${handle}`;
  const optionsText = selected?.selectedOptions?.length
    ? selected.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", ")
    : "";
  const priceText = selected ? formatPrice(selected.price.amount, selected.price.currencyCode) : "";
  const waMessage = [
    `Olá! Tenho interesse no produto *${data.title}*`,
    optionsText && `(${optionsText})`,
    priceText && `— ${priceText}.`,
    `Poderia me ajudar?`,
    productUrl,
  ].filter(Boolean).join(" ");
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {images.map((img, i) => (
            <div key={i} className={`bg-secondary overflow-hidden ${i === 0 ? "md:col-span-2 aspect-[4/5]" : "aspect-square"}`}>
              <img src={img.url} alt={img.altText ?? data.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
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
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" /> Comprar pelo WhatsApp
              </a>
            </Button>
          </div>

          {/* Banner de confiança */}
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Loja física em Joinville</li>
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
    </div>
  );
}

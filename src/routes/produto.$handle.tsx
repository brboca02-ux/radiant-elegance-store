import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";

import { Button } from "@/components/ui/button";
import { formatPrice, STORE_INFO, buildWhatsAppLink } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useProductsStore } from "@/stores/productsStore";
import { productToShopify } from "@/lib/mockProducts";
import { Loader2, ShieldCheck, Truck, RefreshCcw, MapPin, MessageCircle, Flame, X, ChevronLeft, ChevronRight, Check } from "lucide-react";

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

// Mapa de cor -> hex para renderizar as amostras (swatches) compactas.
const COLOR_HEX: Record<string, string> = {
  preto: "#111111", branco: "#fafafa", "off-white": "#f2ebde", offwhite: "#f2ebde",
  cinza: "#8c8c8c", "cinza claro": "#c4c4c4", "cinza escuro": "#4a4a4a", grafite: "#3a3a3a",
  marrom: "#5b3a1e", chocolate: "#4a2b13", caramelo: "#a2703c", bege: "#d9c6a5", nude: "#e6c6ae",
  azul: "#1e3a8a", "azul claro": "#7cb2e8", "azul marinho": "#0d1b3d", "azul turquesa": "#30b5b0",
  turquesa: "#30b5b0", verde: "#3f6b3a", "verde militar": "#4b5320", "verde oliva": "#6b7d3a",
  vermelho: "#a11d1d", vinho: "#5a1a24", rosa: "#e5a1b6", "rosa claro": "#f6cfd8",
  pink: "#e21f7a", amarelo: "#e8c547", mostarda: "#c9971a", roxo: "#5b3a7a", lilas: "#b39ddb", lilás: "#b39ddb",
  laranja: "#d97706", terracota: "#b5522f", palha: "#e8d59a",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function colorSwatch(name: string, override?: string | null): string {
  if (override && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(override)) return override;
  const n = norm(name);
  return COLOR_HEX[n] ?? COLOR_HEX[n.split(" ")[0]] ?? "#cfcfcf";
}

function ProductPage() {
  const { handle } = Route.useParams();
  const products = useProductsStore((s) => s.products);
  const loaded = useProductsStore((s) => s.loaded);
  const loading = useProductsStore((s) => s.loading);

  const product = useMemo(() => products.find((p) => p.slug === handle), [products, handle]);
  const data = useMemo(() => (product ? productToShopify(product).node : null), [product]);

  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const variants = useMemo(() => data?.variants.edges.map((e) => e.node) ?? [], [data]);
  const allImages = useMemo(() => data?.images.edges.map((e) => e.node) ?? [], [data]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => v.selectedOptions.find((o) => o.name === "Cor")?.value && set.add(v.selectedOptions.find((o) => o.name === "Cor")!.value));
    return [...set];
  }, [variants]);

  const colorHexMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    variants.forEach((v) => {
      const c = v.selectedOptions.find((o) => o.name === "Cor")?.value;
      if (c && v.colorHex && !map[c]) map[c] = v.colorHex;
    });
    return map;
  }, [variants]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      const s = v.selectedOptions.find((o) => o.name === "Tamanho")?.value;
      if (s) set.add(s);
    });
    return [...set];
  }, [variants]);

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  // Inicializa seleção com a primeira variante disponível
  useEffect(() => {
    if (!variants.length) return;
    const first = variants.find((v) => v.availableForSale) ?? variants[0];
    setColor(first.selectedOptions.find((o) => o.name === "Cor")?.value ?? null);
    setSize(first.selectedOptions.find((o) => o.name === "Tamanho")?.value ?? null);
  }, [data?.id]); // eslint-disable-line

  const selected = useMemo(() => {
    return (
      variants.find(
        (v) =>
          (!color || v.selectedOptions.find((o) => o.name === "Cor")?.value === color) &&
          (!size || v.selectedOptions.find((o) => o.name === "Tamanho")?.value === size),
      ) ?? null
    );
  }, [variants, color, size]);

  // Tamanhos disponíveis para a cor escolhida
  const sizeAvailability = useMemo(() => {
    const map: Record<string, boolean> = {};
    sizes.forEach((s) => {
      const v = variants.find(
        (vv) =>
          vv.selectedOptions.find((o) => o.name === "Tamanho")?.value === s &&
          (!color || vv.selectedOptions.find((o) => o.name === "Cor")?.value === color),
      );
      map[s] = !!v?.availableForSale;
    });
    return map;
  }, [variants, sizes, color]);

  const colorAvailability = useMemo(() => {
    const map: Record<string, boolean> = {};
    colors.forEach((c) => {
      const v = variants.find(
        (vv) => vv.selectedOptions.find((o) => o.name === "Cor")?.value === c && vv.availableForSale,
      );
      map[c] = !!v;
    });
    return map;
  }, [variants, colors]);

  // Filtra imagens pela cor selecionada (via altText / url); se não houver match, mostra todas.
  const images = useMemo(() => {
    if (!color || allImages.length <= 1) return allImages;
    const key = norm(color);
    const filtered = allImages.filter(
      (i) => norm(i.altText ?? "").includes(key) || norm(i.url).includes(key.replace(/\s+/g, "-")),
    );
    return filtered.length ? filtered : allImages;
  }, [allImages, color]);

  useEffect(() => {
    if (data && selected) {
      track.viewItem({
        id: data.id, name: data.title,
        price: parseFloat(selected.price.amount),
        currency: selected.price.currencyCode,
      });
    }
  }, [data?.id, selected?.id]); // eslint-disable-line

  if (loading || (!loaded && !product)) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (loaded && !product) throw notFound();
  if (!data) return null;

  const soldOut = !selected?.availableForSale;
  const lowStock =
    typeof selected?.quantityAvailable === "number" &&
    selected.quantityAvailable > 0 &&
    selected.quantityAvailable <= 3;

  const handleAdd = async () => {
    if (!selected || soldOut) return;
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
    image: allImages.map((i) => i.url),
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
              key={`${color ?? "x"}-${i}`}
              onClick={() => setLightboxIdx(i)}
              aria-label={`Ampliar imagem ${i + 1}`}
              className={`relative bg-secondary overflow-hidden rounded-md group ${i === 0 ? "md:col-span-2 aspect-[4/5]" : "aspect-square"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary animate-pulse" />
              <img
                src={img.url}
                alt={img.altText ?? data.title}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "auto"}
                onLoad={(e) => { (e.currentTarget.previousSibling as HTMLElement)?.remove(); }}
                className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </button>
          ))}
        </div>


        <div className="lg:sticky lg:top-32 lg:self-start">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">MD Modas</span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-3">{data.title}</h1>
          <div className="mt-4">
            <p className="text-3xl font-bold text-primary">
              {selected ? formatPrice(selected.price.amount, selected.price.currencyCode) : "—"}
            </p>
            {selected && (
              <p className="text-sm text-muted-foreground mt-1">
                ou 4x de {formatPrice(parseFloat(selected.price.amount) / 4, selected.price.currencyCode)} sem juros · <span className="text-[#D4AF37] font-semibold">10% off no Pix</span>
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {soldOut ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  Indisponível
                </span>
              ) : lowStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <Flame className="h-3.5 w-3.5" /> Últimas {selected!.quantityAvailable} peças
                </span>
              ) : (
                selected && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full">
                    Em estoque{typeof selected.quantityAvailable === "number" ? ` · ${selected.quantityAvailable}` : ""}
                  </span>
                )
              )}
            </div>
          </div>

          {colors.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cor: <span className="text-foreground normal-case tracking-normal">{color ?? "—"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = c === color;
                  const avail = colorAvailability[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={c}
                      aria-label={`Cor ${c}`}
                      aria-pressed={active}
                      className={`relative h-9 w-9 rounded-full border transition ${active ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-border hover:border-foreground/50"} ${!avail ? "opacity-40" : ""}`}
                      style={{ backgroundColor: colorSwatch(c) }}
                    >
                      {active && (
                        <Check className="h-4 w-4 absolute inset-0 m-auto text-white mix-blend-difference" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tamanho: <span className="text-foreground normal-case tracking-normal">{size ?? "—"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((s) => {
                  const active = s === size;
                  const avail = sizeAvailability[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      disabled={!avail}
                      aria-pressed={active}
                      className={`min-w-10 h-9 px-3 text-xs font-semibold rounded-md border transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/60"} ${!avail ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            <Button onClick={handleAdd} disabled={isAdding || soldOut || !selected} size="xl" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : soldOut ? "Indisponível" : "🛒 Adicionar à Sacola"}
            </Button>
            <Button asChild size="xl" className="w-full rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white h-14 text-base">
              <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => track.whatsappClick("product")}>
                <MessageCircle className="w-5 h-5 mr-2" /> Comprar pelo WhatsApp
              </a>
            </Button>
          </div>

          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Loja física em {STORE_INFO.city}</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Atendimento pelo WhatsApp</li>
            <li className="flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-primary" /> Troca facilitada</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Compra segura</li>
          </ul>

          <p className="mt-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.description}</p>

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

import { useMemo } from "react";
import { useProductsStore, type Product } from "@/stores/productsStore";
import { productToShopify } from "@/lib/mockProducts";
import { ProductCard } from "./ProductCard";

// Mapa de complementaridade: se o produto atual for "X", priorizamos as
// categorias listadas para recomendar itens que combinem no look.
const COMPLEMENTS: Record<string, string[]> = {
  feminino: ["calcados", "vestidos", "conjuntos"],
  masculino: ["calcados", "conjuntos"],
  infantil: ["calcados"],
  vestidos: ["calcados", "feminino"],
  conjuntos: ["calcados", "feminino", "masculino"],
  "plus-size": ["calcados", "vestidos"],
  calcados: ["feminino", "masculino", "vestidos"],
};

// Detecta "tipo" da peça pelo nome/descrição para casar melhor os pares.
const KEYWORD_PAIRS: { match: RegExp; suggest: RegExp }[] = [
  { match: /(blusa|camisa|camiseta|t-?shirt|crop|top|cacharrel|body)/i, suggest: /(saia|calça|short|bermuda|jeans|legging|sapato|tênis|sandália|scarpin)/i },
  { match: /(saia|calça|short|bermuda|jeans|legging|pantalona)/i, suggest: /(blusa|camisa|camiseta|t-?shirt|crop|top|blazer|cacharrel|sapato|tênis)/i },
  { match: /(vestido)/i, suggest: /(sapato|tênis|sandália|scarpin|bolsa|casaco|cinto)/i },
  { match: /(blazer|casaco|jaqueta|poncho)/i, suggest: /(calça|saia|vestido|blusa|camisa)/i },
  { match: /(sapato|tênis|sandália|scarpin|bota)/i, suggest: /(vestido|calça|saia|blusa)/i },
];

function scoreProduct(current: Product, candidate: Product): number {
  if (candidate.id === current.id) return -1;
  if (candidate.status !== "ativo") return -1;

  let score = 0;
  const currentText = `${current.name} ${current.description}`;
  const candText = `${candidate.name} ${candidate.description}`;

  // 1) Match por palavra-chave (peças complementares no look)
  for (const rule of KEYWORD_PAIRS) {
    if (rule.match.test(currentText) && rule.suggest.test(candText)) {
      score += 10;
      break;
    }
  }

  // 2) Categoria complementar
  const complements = COMPLEMENTS[current.category_id] ?? [];
  if (complements.includes(candidate.category_id)) score += 5;

  // 3) Mesma categoria (menos peso — evita mostrar só variações da mesma peça)
  if (candidate.category_id === current.category_id) score += 2;

  // 4) Faixa de preço próxima (±40%)
  const priceRatio = candidate.price / Math.max(current.price, 1);
  if (priceRatio >= 0.6 && priceRatio <= 1.4) score += 1;

  // 5) Tem estoque
  const hasStock =
    candidate.stock > 0 ||
    candidate.variants.some((v) => v.stock > 0);
  if (hasStock) score += 2;

  return score;
}

export function RelatedProducts({
  currentProduct,
  limit = 12,
}: {
  currentProduct: Product;
  limit?: number;
}) {
  const products = useProductsStore((s) => s.products);

  const recommended = useMemo(() => {
    return products
      .map((p) => ({ p, s: scoreProduct(currentProduct, p) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => productToShopify(x.p));
  }, [products, currentProduct, limit]);

  if (recommended.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-16">
      <div className="border-t border-border pt-10">
        <div className="text-center mb-8">
          <span className="eyebrow">Combina com você</span>
          <h2 className="font-display text-3xl md:text-4xl mt-2">Você também vai gostar</h2>
          <span className="gold-rule mt-4" />
        </div>

        {/* Mostra 3 sugestões por vez; o restante fica acessível por rolagem horizontal (swipe/scroll). */}
        <div className="-mx-4 sm:mx-0">
          <div
            className="flex gap-3 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x px-4 sm:px-0 pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {recommended.map((p) => (
              <div
                key={p.node.id}
                className="shrink-0 snap-start flex basis-[70%] sm:basis-[calc((100%-3rem)/3)]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
          {recommended.length > 3 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Arraste para o lado para ver mais →
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


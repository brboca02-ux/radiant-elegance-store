import { useProductsStore, type Product } from "@/stores/productsStore";
import type { ShopifyProduct } from "@/lib/shopify";

// ---------------------------------------------------------------------------
// Mapeamento cor → imagens
// ---------------------------------------------------------------------------
// Como o banco não possui uma coluna explícita de cor na tabela product_images,
// usamos a seguinte heurística (em ordem de prioridade):
//
//  1. Correspondência por texto: o slug da cor aparece na URL da imagem.
//     Ex.: url contem "branco", "azul-claro", "preto".
//  2. Correspondência posicional: as imagens são divididas igualmente entre
//     as N cores distintas. Se há 6 fotos e 3 cores → cada cor recebe 2 fotos.
//  3. Fallback: todas as imagens (quando não há variantes de cor ou imagens insuf.).
//
// O altText de cada imagem é preenchido com o nome da cor (quando mapeável) para
// que o filtro em produto.$handle.tsx continue funcionando sem alteração.

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna um mapa { cor: [urls...] } construído a partir das imagens e variantes
 * do produto. Cada imagem recebe o altText da cor correspondente.
 */
export function buildColorImageMap(
  images: Product["images"],
  variants: Product["variants"],
  productName: string,
): { colorMap: Record<string, string[]>; altMap: Record<string, string> } {
  // Cores únicas mantendo a ordem de inserção
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  // altMap: url → altText a usar
  const altMap: Record<string, string> = {};

  if (uniqueColors.length === 0 || images.length === 0) {
    images.forEach((i) => { altMap[i.url] = productName; });
    return { colorMap: {}, altMap };
  }

  // --- Tentativa 1: correspondência por texto na URL ---
  const urlMap: Record<string, string[]> = {};
  uniqueColors.forEach((c) => { urlMap[c] = []; });

  images.forEach((img) => {
    const urlNorm = norm(img.url);
    const matched = uniqueColors.find((c) => {
      const slug = norm(c).replace(/\s+/g, "-");
      const plain = norm(c).replace(/\s+/g, "");
      return urlNorm.includes(slug) || urlNorm.includes(plain);
    });
    if (matched) {
      urlMap[matched].push(img.url);
      altMap[img.url] = matched;
    }
  });

  const urlMatchedCount = Object.values(urlMap).reduce((s, arr) => s + arr.length, 0);

  // Se ao menos metade das imagens bateu por URL, confiamos neste mapeamento.
  if (urlMatchedCount >= Math.ceil(images.length / 2)) {
    // Imagens não mapeadas vão para a primeira cor como fallback
    images.forEach((img) => {
      if (!altMap[img.url]) {
        urlMap[uniqueColors[0]].push(img.url);
        altMap[img.url] = uniqueColors[0];
      }
    });
    return { colorMap: urlMap, altMap };
  }

  // --- Tentativa 2: correspondência posicional ---
  // Divide as imagens (ordenadas por position) em N fatias iguais.
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const posMap: Record<string, string[]> = {};
  uniqueColors.forEach((c) => { posMap[c] = []; });

  const totalImgs = sorted.length;
  const n = uniqueColors.length;

  if (totalImgs >= n) {
    // Cada cor recebe Math.floor(totalImgs/n) imagens; as sobras vão para as últimas cores.
    const base = Math.floor(totalImgs / n);
    const extra = totalImgs % n;
    let idx = 0;
    uniqueColors.forEach((c, ci) => {
      const count = base + (ci < extra ? 1 : 0);
      for (let j = 0; j < count && idx < totalImgs; j++, idx++) {
        posMap[c].push(sorted[idx].url);
        altMap[sorted[idx].url] = c;
      }
    });
  } else {
    // Menos imagens do que cores: cada imagem vai para uma cor, o resto fica sem foto própria.
    sorted.forEach((img, i) => {
      const c = uniqueColors[i] ?? uniqueColors[0];
      posMap[c].push(img.url);
      altMap[img.url] = c;
    });
    // Cores sem imagem compartilham a primeira disponível
    uniqueColors.forEach((c) => {
      if (posMap[c].length === 0 && sorted.length > 0) {
        posMap[c] = [sorted[0].url];
      }
    });
  }

  return { colorMap: posMap, altMap };
}

// Converte um Product mocado (admin) para o formato ShopifyProduct usado pela vitrine.
export function productToShopify(p: Product): ShopifyProduct {
  const price = (p.sale_price ?? p.price).toFixed(2);
  const rawImages = p.images.length
    ? p.images
    : [{ id: "ph", product_id: p.id, url: `https://picsum.photos/seed/${p.slug}/800/1000`, position: 0, is_primary: true }];

  const { colorMap, altMap } = buildColorImageMap(rawImages, p.variants, p.name);

  return {
    node: {
      id: `mock:${p.id}`,
      title: p.name,
      description: p.description,
      handle: p.slug,
      productType: p.category_id,
      tags: [p.category_id],
      totalInventory: p.stock,
      priceRange: { minVariantPrice: { amount: price, currencyCode: "BRL" } },
      // altText de cada imagem = nome da cor correspondente (quando mapeável),
      // permitindo que a página de produto filtre por cor de forma confiável.
      images: {
        edges: rawImages.map((i) => ({
          node: { url: i.url, altText: altMap[i.url] ?? p.name },
        })),
      },
      // colorImages: mapeamento direto cor → [urls] — usado pela página de produto
      // para trocar a galeria sem depender de heurísticas de texto/posição.
      colorImages: Object.keys(colorMap).length > 0 ? colorMap : undefined,
      variants: {
        edges: (p.variants.length
          ? p.variants
          : [{ id: `v_${p.id}`, product_id: p.id, size: "Único", color: "Padrão", stock: p.stock, color_hex: null }]
        ).map((v) => ({
          node: {
            id: `mock:${v.id}`,
            title: `${v.size} / ${v.color}`,
            price: { amount: price, currencyCode: "BRL" },
            availableForSale: v.stock > 0,
            quantityAvailable: v.stock,
            selectedOptions: [
              { name: "Tamanho", value: String(v.size) },
              { name: "Cor", value: v.color },
            ],
            colorHex: v.color_hex ?? null,
          },
        })),
      },
      options: [
        { name: "Tamanho", values: [...new Set(p.variants.map((v) => String(v.size)))] },
        { name: "Cor", values: [...new Set(p.variants.map((v) => v.color))] },
      ],
    },
  };
}

// Pega produtos mocados filtrados por uma string de query simples (categoria ou título).
export function getMockShopifyProducts(opts: { query?: string; first?: number } = {}): ShopifyProduct[] {
  const all = useProductsStore.getState().products.filter((p) => p.status === "ativo");
  const q = (opts.query ?? "").toLowerCase();
  const filtered = q
    ? all.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category_id.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    : all;
  return filtered.slice(0, opts.first ?? 12).map(productToShopify);
}

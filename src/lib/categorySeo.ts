// SEO textual único por categoria — títulos, descrições e copy de intro
// usados na página /colecao?c=<id> para reforçar ranqueamento long-tail.

export interface CategorySeo {
  id: string;
  name: string;
  title: string;         // <title>
  description: string;   // meta description (≤160)
  h1: string;            // H1 na página
  eyebrow: string;       // "olho" acima do H1
  intro: string;         // parágrafo de contexto (rico em keywords, natural)
  keywords: string[];    // palavras-chave alvo (para <meta name="keywords">)
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  feminino: {
    id: "feminino",
    name: "Feminino",
    title: "Moda Feminina em Joinville — T-Shirts e Calças Jeans | J&S Store",
    description:
      "Moda feminina em Joinville: t-shirts em algodão e calças jeans importadas na J&S Store. Compre online com envio para todo o Brasil.",
    h1: "Moda Feminina",
    eyebrow: "Coleção Feminina",
    intro:
      "Descubra a coleção feminina da J&S Store: t-shirts em malha 100% algodão e calças jeans importadas com elastano, selecionadas a dedo na nossa loja em Joinville. Peças versáteis para o dia a dia, com atendimento próximo pelo WhatsApp e envio para todo o Brasil.",
    keywords: ["moda feminina joinville", "roupa feminina", "calça jeans feminina importada", "t-shirt feminina"],
  },
  masculino: {
    id: "masculino",
    name: "Masculino",
    title: "Moda Masculina em Joinville — Camisas, Bermudas e Calças | J&S Store",
    description:
      "Roupas masculinas na J&S Store: camisas polo, camisetas peruanas, bermudas, shorts e calças jeans e sarja. Loja em Joinville com envio para todo o Brasil.",
    h1: "Moda Masculina",
    eyebrow: "Coleção Masculina",
    intro:
      "A coleção masculina da J&S Store reúne camisas gola polo importadas, camisetas peruanas e Supima, bermudas e shorts de sarja e calças jeans com elastano. Modelagens atuais, tecidos de qualidade e curadoria feita na nossa loja física em Joinville.",
    keywords: ["moda masculina joinville", "camisa polo importada", "camiseta peruana", "bermuda de sarja"],
  },
  promocoes: {
    id: "promocoes",
    name: "Promoções",
    title: "Promoções J&S Store — Moda com Desconto em Joinville",
    description:
      "Peças selecionadas com desconto na J&S Store. Aproveite as promoções de moda masculina e feminina enquanto durar o estoque.",
    h1: "Promoções",
    eyebrow: "Ofertas da semana",
    intro:
      "Seleção de peças com preço promocional na J&S Store. Moda masculina e feminina com desconto real, curadoria da nossa loja em Joinville e envio para todo o Brasil.",
    keywords: ["promoção de roupas joinville", "moda com desconto", "roupas em promoção", "outlet de moda joinville"],
  },
  "recebidos-da-semana": {
    id: "recebidos-da-semana",
    name: "Recebidos da Semana",
    title: "Recebidos da Semana — Novidades J&S Store Joinville",
    description:
      "Confira os recebidos da semana na J&S Store: novidades de moda masculina e feminina que acabaram de chegar em Joinville.",
    h1: "Recebidos da Semana",
    eyebrow: "Acabou de chegar",
    intro:
      "As peças que acabaram de chegar na J&S Store. Novidades de moda masculina e feminina toda semana, selecionadas na nossa loja em Joinville, com envio para todo o Brasil.",
    keywords: ["novidades moda joinville", "recebidos da semana", "roupas novas joinville", "lançamentos de moda"],
  },
};


export function getCategorySeo(id?: string): CategorySeo | null {
  if (!id) return null;
  const direct = CATEGORY_SEO[id];
  if (direct) return direct;

  // Apelidos de coleção (ex.: "ultimas", "novidades") reaproveitam o SEO canônico.
  const kind = resolveCollection(id);
  if (kind === "promo") return CATEGORY_SEO["promocoes"] ?? null;
  if (kind === "recent") return CATEGORY_SEO["recebidos-da-semana"] ?? null;
  return null;
}


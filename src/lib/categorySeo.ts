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
    title: "Moda Feminina em Joinville — Vestidos, Blusas e Conjuntos | J&S Store",
    description:
      "Moda feminina em Joinville: vestidos, blusas, conjuntos, calças e novidades toda semana na J&S Store. Compre online com envio para todo o Brasil.",
    h1: "Moda Feminina",
    eyebrow: "Coleção Feminina",
    intro:
      "Descubra a coleção feminina da J&S Store: vestidos, blusas, conjuntos, calças e saias selecionados a dedo na loja do Aventureiro, em Joinville. Peças versáteis para o dia a dia, trabalho e ocasiões especiais, com atendimento próximo pelo WhatsApp e envio para todo o Brasil.",
    keywords: ["moda feminina joinville", "roupa feminina", "loja feminina aventureiro", "vestidos femininos"],
  },
  masculino: {
    id: "masculino",
    name: "Masculino",
    title: "Moda Masculina em Joinville — Camisas, Bermudas e Calças | J&S Store",
    description:
      "Roupas masculinas na J&S Store: camisas, camisetas, bermudas, calças e conjuntos com estilo e conforto. Loja em Joinville com envio para todo o Brasil.",
    h1: "Moda Masculina",
    eyebrow: "Coleção Masculina",
    intro:
      "A coleção masculina da J&S Store reúne camisas, camisetas, bermudas, calças e conjuntos pensados para o homem que valoriza conforto e presença. Modelagens atuais, tecidos de qualidade e curadoria feita na nossa loja física em Joinville.",
    keywords: ["moda masculina joinville", "roupa masculina", "camisa masculina", "bermuda masculina"],
  },
  vestidos: {
    id: "vestidos",
    name: "Vestidos",
    title: "Vestidos Femininos — Curtos, Longos, Festa e Casual | J&S Store Joinville",
    description:
      "Vestidos femininos na J&S Store: curtos, midi, longos, de festa, casuais e plus size. Muitos modelos, tamanhos e cores. Envio para todo o Brasil.",
    h1: "Vestidos Femininos",
    eyebrow: "Vestidos",
    intro:
      "Encontre o vestido certo para cada ocasião: casuais para o dia a dia, midi para o trabalho, longos e de festa para momentos especiais e opções plus size que valorizam todas as silhuetas. Curadoria da J&S Store em Joinville, com envio para todo o Brasil.",
    keywords: ["vestidos femininos", "vestido de festa", "vestido midi", "vestido plus size"],
  },
  conjuntos: {
    id: "conjuntos",
    name: "Conjuntos",
    title: "Conjuntos Femininos — Blusa e Calça, Cropped e Short | J&S Store",
    description:
      "Conjuntos femininos na J&S Store: blusa e calça, cropped e short, alfaiataria e casual. Looks prontos com estilo, do PP ao plus size.",
    h1: "Conjuntos Femininos",
    eyebrow: "Conjuntos",
    intro:
      "Conjuntos são a forma mais prática de montar um look completo em segundos. Na J&S Store você encontra blusa e calça, cropped e short, opções em alfaiataria e casual — do PP ao plus size, com envio para todo o Brasil.",
    keywords: ["conjunto feminino", "conjunto cropped e short", "conjunto blusa e calça", "conjunto alfaiataria"],
  },
  "plus-size": {
    id: "plus-size",
    name: "Plus Size",
    title: "Moda Plus Size Feminina — Vestidos, Conjuntos e Blusas | J&S Store Joinville",
    description:
      "Moda plus size feminina na J&S Store: vestidos, conjuntos, blusas e calças do G ao G4. Modelagens que valorizam curvas. Envio para todo o Brasil.",
    h1: "Moda Plus Size",
    eyebrow: "Plus Size",
    intro:
      "A coleção plus size da J&S Store foi pensada para valorizar cada curva com modelagens confortáveis, tecidos com bom caimento e numeração ampliada. Vestidos, conjuntos, blusas, calças e mais — do G ao G4, com atendimento humanizado em Joinville.",
    keywords: ["moda plus size", "vestido plus size", "roupa plus size joinville", "conjunto plus size"],
  },
};

export function getCategorySeo(id?: string): CategorySeo | null {
  if (!id) return null;
  return CATEGORY_SEO[id] ?? null;
}

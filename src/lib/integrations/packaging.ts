export type ClothingCategory =
  | "BLUSA"
  | "CALCA"
  | "VESTIDO"
  | "SHORT"
  | "CONJUNTO"
  | "SAIA"
  | "DEFAULT";

export interface PackageProfile {
  weightKg: number;    // Peso unitário da peça em kg
  heightCm: number;    // Altura/espessura da peça dobrada em cm
  widthCm: number;     // Largura mínima do pacote
  lengthCm: number;    // Comprimento mínimo do pacote
}

// Perfis determinísticos e configuráveis para moda feminina/vestuário
export const PACKAGING_PROFILES: Record<ClothingCategory, PackageProfile> = {
  BLUSA: {
    weightKg: 0.18,
    heightCm: 2,
    widthCm: 22,
    lengthCm: 28,
  },
  CALCA: {
    weightKg: 0.45,
    heightCm: 4,
    widthCm: 25,
    lengthCm: 32,
  },
  VESTIDO: {
    weightKg: 0.32,
    heightCm: 3,
    widthCm: 24,
    lengthCm: 30,
  },
  SHORT: {
    weightKg: 0.22,
    heightCm: 2.5,
    widthCm: 22,
    lengthCm: 26,
  },
  CONJUNTO: {
    weightKg: 0.55,
    heightCm: 5,
    widthCm: 26,
    lengthCm: 34,
  },
  SAIA: {
    weightKg: 0.25,
    heightCm: 2.5,
    widthCm: 22,
    lengthCm: 28,
  },
  DEFAULT: {
    weightKg: 0.28,
    heightCm: 3,
    widthCm: 24,
    lengthCm: 30,
  },
};

// Margem separada e configurável da embalagem (ex: envelope de segurança / caixa)
export const PACKAGING_CONFIG = {
  packageMarginKg: 0.05, // 50g para o envelope/caixa
  minHeightCm: 4,        // Altura mínima dos Correios/Melhor Envio
  minWidthCm: 11,        // Largura mínima dos Correios/Melhor Envio
  minLengthCm: 16,       // Comprimento mínimo dos Correios/Melhor Envio
};

export interface PackageItemInput {
  quantity: number;
  category?: string | null;
  title?: string | null;
  tags?: string[] | null;
  // Medidas manuais cadastradas no produto (caso existam)
  weight?: number | null;
  height_cm?: number | null;
  width_cm?: number | null;
  length_cm?: number | null;
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Detecta a categoria baseando-se em productType, tags ou no título da peça
export function detectCategory(item: PackageItemInput): ClothingCategory {
  const haystack = normalize(
    [item.category ?? "", item.title ?? "", ...(item.tags ?? [])].join(" ")
  );

  if (haystack.includes("CONJUNTO")) return "CONJUNTO";
  if (haystack.includes("VESTIDO")) return "VESTIDO";
  if (haystack.includes("CALCA") || haystack.includes("JEANS") || haystack.includes("PANTALONA")) return "CALCA";
  if (haystack.includes("SHORT") || haystack.includes("BERMUDA")) return "SHORT";
  if (haystack.includes("SAIA")) return "SAIA";
  if (haystack.includes("BLUSA") || haystack.includes("CAMISA") || haystack.includes("CROPPED") || haystack.includes("T-SHIRT") || haystack.includes("REGATA") || haystack.includes("BODY")) return "BLUSA";

  return "DEFAULT";
}

export interface CalculatedPackage {
  weight: number;
  height: number;
  width: number;
  length: number;
}

/**
 * Calcula o pacote consolidado para cotação:
 * - Peso: soma dos pesos unitários × quantidade + margem da embalagem.
 * - Prioridade campo a campo: medidas manuais sobressaem ao perfil individualmente.
 * - Altura: acumulada conforme peças adicionadas.
 * - Largura e comprimento: determinados pela maior dimensão necessária.
 */
export function calculateConsolidatedPackage(items: PackageItemInput[]): CalculatedPackage {
  if (!items.length) {
    const def = PACKAGING_PROFILES.DEFAULT;
    return {
      weight: +(def.weightKg + PACKAGING_CONFIG.packageMarginKg).toFixed(2),
      height: Math.max(def.heightCm, PACKAGING_CONFIG.minHeightCm),
      width: Math.max(def.widthCm, PACKAGING_CONFIG.minWidthCm),
      length: Math.max(def.lengthCm, PACKAGING_CONFIG.minLengthCm),
    };
  }

  let totalItemsWeight = 0;
  let totalHeight = 0;
  let maxWidth = PACKAGING_CONFIG.minWidthCm;
  let maxLength = PACKAGING_CONFIG.minLengthCm;

  for (const item of items) {
    const qty = Math.max(1, item.quantity);
    const cat = detectCategory(item);
    const profile = PACKAGING_PROFILES[cat];

    // Regra de prioridade individual por campo:
    const itemWeight = (typeof item.weight === "number" && item.weight > 0) ? item.weight : profile.weightKg;
    const itemHeight = (typeof item.height_cm === "number" && item.height_cm > 0) ? item.height_cm : profile.heightCm;
    const itemWidth = (typeof item.width_cm === "number" && item.width_cm > 0) ? item.width_cm : profile.widthCm;
    const itemLength = (typeof item.length_cm === "number" && item.length_cm > 0) ? item.length_cm : profile.lengthCm;

    totalItemsWeight += itemWeight * qty;
    totalHeight += itemHeight * qty;
    maxWidth = Math.max(maxWidth, itemWidth);
    maxLength = Math.max(maxLength, itemLength);
  }

  const finalWeight = +(totalItemsWeight + PACKAGING_CONFIG.packageMarginKg).toFixed(2);
  const finalHeight = Math.max(Math.ceil(totalHeight), PACKAGING_CONFIG.minHeightCm);
  const finalWidth = Math.max(Math.ceil(maxWidth), PACKAGING_CONFIG.minWidthCm);
  const finalLength = Math.max(Math.ceil(maxLength), PACKAGING_CONFIG.minLengthCm);

  return {
    weight: finalWeight,
    height: finalHeight,
    width: finalWidth,
    length: finalLength,
  };
}
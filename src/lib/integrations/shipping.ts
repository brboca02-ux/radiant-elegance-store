// Orquestrador de frete: Uber Direct (Local Joinville) + Melhor Envio (Nacional)
import { quoteMelhorEnvio } from "./melhorenvio.functions";
import { quoteUberDirect } from "./uberdirect.functions";

export const FREE_SHIPPING_THRESHOLD = 299;

export interface ShippingQuote {
  code: string;
  name: string;
  price: number;
  days: number;
  description?: string;
  carrier?: string;
  quoteId?: string;
  expiresAt?: string;
  dropoffEta?: string;
}

export interface ShippingQuoteInput {
  cep: string;
  subtotal: number;
  itemsCount: number;
  items?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unitary_value: number;
    weight: number | null;
    height: number | null;
    width: number | null;
    length: number | null;
  }>;
  city?: string;
  state?: string;
  district?: string;
  street?: string;
  number?: string;
}


// Faixas de entrega rápida em Joinville via Moto/Uber (fallback quando a API falha)
type JoinvilleZone = { price: number; label: string; districts: string[] };

const JOINVILLE_ZONES: JoinvilleZone[] = [
  {
    price: 12,
    label: "Centro e bairros próximos",
    districts: [
      "CENTRO", "AMERICA", "ANITA GARIBALDI", "ATIRADORES", "BOM RETIRO",
      "BUCAREIN", "COSTA E SILVA", "FLORESTA", "GLORIA", "GUANABARA",
      "ITAUM", "JARDIM IRIRIU", "SAGUACU", "SANTO ANTONIO", "BOEHMERWALD",
    ],
  },
  {
    price: 18,
    label: "Faixa intermediária",
    districts: [
      "ADHEMAR GARCIA", "AVENTUREIRO", "BOA VISTA", "COMASA", "ESPINHEIROS",
      "FATIMA", "IRIRIU", "JARDIM PARAISO", "JARDIM SOFIA", "JARIVATUBA",
      "NOVA BRASILIA", "PARANAGUAMIRIM", "PETROPOLIS", "PROFIPO",
      "SANTA CATARINA", "SAO MARCOS", "VILA CUBATAO", "VILA NOVA",
      "MORRO DO MEIO", "ULYSSES GUIMARAES",
    ],
  },
  {
    price: 26,
    label: "Faixa externa e distritos",
    districts: [
      "PIRABEIRABA", "RIO BONITO", "CANTA GALO", "ZONA INDUSTRIAL NORTE",
      "ZONA INDUSTRIAL TUPY", "VILA RURAL", "DONA FRANCISCA", "JOAO COSTA",
    ],
  },
];

// Normaliza texto para comparações sem acento
function cleanText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getUberRate(district?: string): number {
  if (!district) return 15; // taxa média padrão se não identificado
  const target = cleanText(district);
  for (const zone of JOINVILLE_ZONES) {
    if (zone.districts.some((d) => cleanText(d) === target || target.includes(cleanText(d)))) {
      return zone.price;
    }
  }
  return 18;
}

export const StoreShippingProvider = {
  name: "js-store-orchestrator",
  async quote({ cep, subtotal, itemsCount, city, state, district, street, number, items }: ShippingQuoteInput)  {
    const cleanCep = cep.replace(/\D/g, "");
    const isJoinville =
      (city && cleanText(city).includes("JOINVILLE")) ||
      cleanCep.startsWith("8920") ||
      cleanCep.startsWith("8921") ||
      cleanCep.startsWith("8922") ||
      cleanCep.startsWith("8923");

    const quotes: ShippingQuote[] = [];

    // 1. RETIRADA NA LOJA (sempre presente)
    quotes.push({
      code: "retirada",
      name: "Retirada na loja (Joinville/SC)",
      price: 0,
      days: 0,
      description: "Pronto para retirada em até 24h úteis.",
    });

    // 2. ENTREGA EXPRESSA LOCAL VIA UBER DIRECT (sem frete grátis)
    if (isJoinville) {
      let uberPrice = getUberRate(district); // fallback por faixa de bairro
      let eta: number | undefined;

      try {
        const uber = await quoteUberDirect({
          data: { cep: cleanCep, city: city || "Joinville", state: state || "SC", district, street, number, subtotal },
        });
        if (uber && !uber.error && uber.fee > 0 && uber.quoteId) {
          uberPrice = uber.fee;
          eta = uber.estimatedMinutes;
        }
      } catch (e) {
        console.warn("[frete] Uber Direct indisponível, usando tabela de faixas:", e);
      }

      quotes.push({
        code: "uber-direct",
        name: "Uber Flash / Entrega Expressa",
        price: uberPrice,
        days: 0,
        description: eta
          ? `Entrega hoje via motorista parceiro Uber (~${eta} min)`
          : "Entrega expressa no mesmo dia via motorista parceiro Uber",
        carrier: "Uber Direct",
        ...(uber && !uber.error ? {
          quoteId: uber.quoteId,
          expiresAt: uber.expiresAt,
          dropoffEta: uber.dropoffEta,
        } : {}),
      });
    }

    // 3. COTAÇÃO NACIONAL VIA MELHOR ENVIO (frete grátis acima do limite)
    const freeNational = subtotal >= FREE_SHIPPING_THRESHOLD;
    try {
      const res = await quoteMelhorEnvio({
        data: {
          toCep: cleanCep,
          insuranceValue: subtotal,
          itemsCount,
          items: items ?? [],
        },
      });

      for (const q of res.quotes ?? []) {
        quotes.push({
          code: q.code,
          name: q.name,
          price: freeNational ? 0 : q.price,
          days: q.days,
          description: freeNational ? "Frete conforme local de entrega" : undefined,
          carrier: q.carrier || "Melhor Envio",
        });
      }
    } catch (err) {
      console.warn("[frete] Melhor Envio offline ou não configurado:", err);
    }

    return quotes;
  },
};
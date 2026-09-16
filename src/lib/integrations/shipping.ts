// Orquestrador de frete: Uber (Local Joinville) + Melhor Envio (Nacional)
import { quoteMelhorEnvio } from "./melhorenvio.functions";
import { quoteUberDirect } from "./uberdirect.functions";

export interface ShippingQuote {
  code: string;
  name: string;
  price: number;
  days: number;
  description?: string;
  carrier?: string;
}

export interface ShippingQuoteInput {
  cep: string;
  subtotal: number;
  itemsCount: number;
  city?: string;
  state?: string;
  district?: string;
}

export interface ShippingProvider {
  name: string;
  quote(input: ShippingQuoteInput): Promise<ShippingQuote[]>;
}

// Faixas de entrega rápida em Joinville via Moto/Uber
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

export const StoreShippingProvider: ShippingProvider = {
  name: "js-store-orchestrator",
  async quote({ cep, subtotal, itemsCount, city, district }) {
    const cleanCep = cep.replace(/\D/g, "");
    const isJoinville =
      (city && cleanText(city).includes("JOINVILLE")) ||
      cleanCep.startsWith("8920") ||
      cleanCep.startsWith("8921") ||
      cleanCep.startsWith("8922") ||
      cleanCep.startsWith("8923");

    const quotes: ShippingQuote[] = [];

    // 1. RETIRADA NA LOJA (Sempre presente)
    quotes.push({
      code: "retirada",
      name: "Retirada na loja (Joinville/SC)",
      price: 0,
      days: 0,
      description: "Pronto para retirada em até 24h úteis.",
    });

     // 2. ENTREGA EXPRESSA LOCAL VIA UBER DIRECT
    if (isJoinville) {
      let uberPrice = getUberRate(district); // Preço base fallback

      try {
        // Tenta cotar na API oficial da Uber em tempo real
        const uberQuote = await quoteUberDirect({
          cep: cleanCep,
          city: city || "Joinville",
          district,
          subtotal,
        });

        if (uberQuote && typeof uberQuote.fee === "number") {
          uberPrice = uberQuote.fee;
        }
      } catch (e) {
        console.warn("Usando tabela fixa de zonas para Uber:", e);
      }

      quotes.push({
        code: "uber-direct",
        name: "Uber Flash / Entrega Expressa",
        price: uberPrice,
        description: freeShipping
          : "Entrega expressa no mesmo dia via motorista parceiro Uber",
        carrier: "Uber Direct",
      });
    }

    // 3. COTAÇÃO NACIONAL VIA MELHOR ENVIO (Correios PAC/SEDEX, Jadlog, etc.)
    try {
      const meQuotes = await quoteMelhorEnvio({
        cep: cleanCep,
        subtotal,
        itemsCount,
      });

      if (meQuotes && meQuotes.length > 0) {
        meQuotes.forEach((q) => {
          quotes.push({
            code: q.code,
            name: q.name,
            price: q.price,
            description: q.description,
          });
        });
      }
    } catch (err) {
      console.warn("Melhor Envio offline ou não configurado:", err);
      // Fallback simples se Melhor Envio falhar e for fora de Joinville
      if (!isJoinville && quotes.length === 1) {
        quotes.push({
          code: "pac-fallback",
          name: "Correios PAC (Estimativa)",
          price: 28.5,
          days: 6,
          description: "Envio padrão econômico",
          carrier: "Correios",
        });
      }
    }

    return quotes;
  },
};

export const shipping: ShippingProvider = StoreShippingProvider;
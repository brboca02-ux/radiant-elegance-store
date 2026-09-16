// Orquestrador de frete.
// - Dentro de Joinville: retirada na loja + entrega rápida (moto/Uber) por faixa
//   de bairro/distância (JOINVILLE_ZONES, editável abaixo).
// - Fora de Joinville: cotação em tempo real no Melhor Envio; se a API falhar ou
//   não estiver configurada, usa a tabela fixa CITY_TABLE como fallback.

import { quoteMelhorEnvio } from "./melhorenvio.functions";

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

const FREE_SHIPPING_THRESHOLD = 299;

// Faixas de entrega rápida em Joinville (moto/Uber). Ajuste livremente.
type JoinvilleZone = { price: number; label: string; districts: string[] };

const JOINVILLE_ZONES: JoinvilleZone[] = [
  {
    price: 12,
    label: "Centro e bairros próximos (até ~5 km)",
    districts: [
      "CENTRO", "AMERICA", "ANITA GARIBALDI", "ATIRADORES", "BOM RETIRO",
      "BUCAREIN", "COSTA E SILVA", "FLORESTA", "GLORIA", "GUANABARA",
      "ITAUM", "JARDIM IRIRIU", "SAGUACU", "SANTO ANTONIO", "BOEHMERWALD",
    ],
  },
  {
    price: 18,
    label: "Faixa intermediária (5–10 km)",
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
    label: "Faixa externa e distritos (10–20 km)",
    districts: [
      "PIRABEIRABA", "RIO BONITO", "CANTA GALO", "ZONA INDUSTRIAL NORTE",
      "ZONA INDUSTRIAL TUPY", "VILA RURAL", "DONA FRANCISCA", "JOAO COSTA",
    ],
  },
];


// Normaliza nome de cidade: remove acentos, uppercase, tira parênteses.
function normalizeCity(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-zA-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Tabela de fretes por cidade a partir de Joinville. Todas por nota até 50kg.
// Preço em R$. `partner` = cidade atendida via THE FLASH.
type CityRate = { price: number; partner?: boolean; note?: string };

const CITY_TABLE: Record<string, CityRate> = {
  AGROLANDIA: { price: 58 },
  AGRONOMICA: { price: 52 },
  "AGUAS MORNAS": { price: 50 },
  APIUNA: { price: 56, partner: true },
  ARAQUARI: { price: 16 },
  ARAUCARIA: { price: 45 },
  ASCURRA: { price: 45, partner: true },
  AURORA: { price: 57 },
  "BALNEARIO BARRA DO SUL": { price: 16 },
  "BALNEARIO CAMBORIU": { price: 41 },
  "BALNEARIO PICARRAS": { price: 33 },
  PICARRAS: { price: 33 },
  "BARRA VELHA": { price: 33 },
  "BENEDITO NOVO": { price: 45, partner: true, note: "2ª, 4ª e 6ª, até 12h" },
  BIGUACU: { price: 49 },
  BLUMENAU: { price: 37 },
  "BRACO DO TROMBUDO": { price: 57 },
  BRUSQUE: { price: 42 },
  CAMBORIU: { price: 41 },
  "CAMPO ALEGRE": { price: 41 },
  CANELINHA: { price: 44 },
  COLOMBO: { price: 43 },
  CORUPA: { price: 37 },
  CURITIBA: { price: 43 },
  "DOUTOR PEDRINHO": { price: 45, partner: true, note: "2ª, 4ª e 6ª, até 12h" },
  FLORIANOPOLIS: { price: 49 },
  GARUVA: { price: 14 },
  GASPAR: { price: 42 },
  "GOVERNADOR CELSO RAMOS": { price: 50 },
  GUABIRUBA: { price: 46 },
  GUARAMIRIM: { price: 32 },
  IBIRAMA: { price: 57 },
  ILHOTA: { price: 42 },
  INDAIAL: { price: 40, partner: true },
  ITAJAI: { price: 41 },
  ITAPEMA: { price: 42 },
  ITAPOA: { price: 14 },
  ITUPORANGA: { price: 57 },
  "JARAGUA DO SUL": { price: 32 },
  JOINVILLE: { price: 14 },
  LAURENTINO: { price: 57 },
  LONTRAS: { price: 52 },
  "LUIZ ALVES": { price: 42 },
  MAFRA: { price: 41 },
  MASSARANDUBA: { price: 32 },
  NAVEGANTES: { price: 41 },
  "NOVA TRENTO": { price: 45 },
  PALHOCA: { price: 49 },
  PENHA: { price: 41 },
  PINHAIS: { price: 43 },
  POMERODE: { price: 37 },
  "PORTO BELO": { price: 43 },
  "POUSO REDONDO": { price: 57 },
  "PRESIDENTE GETULIO": { price: 57 },
  "RIO DO OESTE": { price: 57 },
  "RIO DO SUL": { price: 52 },
  "RIO DOS CEDROS": { price: 45, partner: true },
  "RIO NEGRINHO": { price: 41 },
  "RIO NEGRO": { price: 41 },
  RODEIO: { price: 45, partner: true },
  "SANTO AMARO DA IMPERATRIZ": { price: 50 },
  "SAO BENTO DO SUL": { price: 39 },
  "SAO FRANCISCO DO SUL": { price: 16 },
  "SAO JOAO BATISTA": { price: 45 },
  "SAO JOAO DO ITAPERIU": { price: 33 },
  "SAO JOSE": { price: 49 },
  "SAO JOSE DOS PINHAIS": { price: 43 },
  SCHROEDER: { price: 37 },
  TAIO: { price: 57 },
  TIJUCAS: { price: 44 },
  TIMBO: { price: 40, partner: true },
  "TROMBUDO CENTRAL": { price: 58 },
};

function lookupCity(city?: string): CityRate | null {
  if (!city) return null;
  const key = normalizeCity(city);
  if (CITY_TABLE[key]) return CITY_TABLE[key];
  // heurísticas — cidades com sufixos removidos
  for (const k of Object.keys(CITY_TABLE)) {
    if (key.startsWith(k) || k.startsWith(key)) return CITY_TABLE[k];
  }
  return null;
}

export const StoreShippingProvider: ShippingProvider = {
  name: "js-store-joinville",
  async quote({ cep, subtotal, city }) {
    const cleanCep = cep.replace(/\D/g, "");
    const isJoinvilleCep = cleanCep.startsWith("892") || cleanCep.startsWith("891");
    const rate = lookupCity(city);
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    const opts: ShippingQuote[] = [];

    // Retirada na loja — sempre disponível (cliente vai até Joinville).
    opts.push({
      code: "retirada",
      name: "Retirada na loja (Joinville/SC)",
      price: 0,
      days: 1,
      description: "Pronto em até 24h úteis. Rua a combinar após o pedido.",
    });

    if (rate) {
      opts.push({
        code: rate.partner ? "flash" : "entrega-propria",
        name: rate.partner
          ? "Entrega parceira (THE FLASH)"
          : "Entrega J&S Store",
        price: freeShipping ? 0 : rate.price,
        days: 2,
        description: freeShipping
          ? "Frete grátis acima de R$ 299 · próximo dia útil após a coleta"
          : rate.note ?? "Próximo dia útil após a coleta (8h às 18h)",
        carrier: rate.partner ? "THE FLASH" : "J&S Store",
      });
    } else if (isJoinvilleCep) {
      opts.push({
        code: "entrega-propria",
        name: "Entrega J&S Store — Joinville",
        price: freeShipping ? 0 : 14,
        days: 1,
        description: "Entrega no mesmo dia ou próximo dia útil",
      });
    } else {
      // fora da nossa área — sinaliza que precisa cotar
      opts.push({
        code: "cotacao",
        name: "Fora da área — cotação sob consulta",
        price: 0,
        days: 5,
        description:
          "Sua cidade não está na tabela. Entraremos em contato com o valor pelos Correios/transportadora antes de faturar.",
      });
    }

    return opts;
  },
};

export const shipping: ShippingProvider = StoreShippingProvider;

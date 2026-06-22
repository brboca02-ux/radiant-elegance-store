// Adapter de frete. Hoje retorna tabela fixa. Quando você escolher
// Melhor Envio / Frenet / Correios, troque a implementação ativa.

export interface ShippingQuote {
  code: string;          // identificador interno
  name: string;          // mostrado pro cliente
  price: number;         // R$
  days: number;          // prazo em dias úteis
  description?: string;
}

export interface ShippingQuoteInput {
  cep: string;
  subtotal: number;
  itemsCount: number;
}

export interface ShippingProvider {
  name: string;
  quote(input: ShippingQuoteInput): Promise<ShippingQuote[]>;
}

const FREE_SHIPPING_THRESHOLD = 299;

export const MockShippingProvider: ShippingProvider = {
  name: "mock",
  async quote({ cep, subtotal }) {
    const cleanCep = cep.replace(/\D/g, "");
    const isJoinville = cleanCep.startsWith("892") || cleanCep.startsWith("891");
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    const opts: ShippingQuote[] = [];

    if (isJoinville) {
      opts.push({
        code: "retirada",
        name: "Retirada na loja (Joinville)",
        price: 0,
        days: 1,
        description: "Pronto em até 24h",
      });
    }

    opts.push({
      code: "pac",
      name: "PAC — Correios",
      price: freeShipping ? 0 : 19.9,
      days: 5,
      description: freeShipping ? "Frete grátis acima de R$ 299" : undefined,
    });

    opts.push({
      code: "sedex",
      name: "SEDEX — Correios",
      price: 34.9,
      days: 2,
    });

    return opts;
  },
};

export const shipping: ShippingProvider = MockShippingProvider;

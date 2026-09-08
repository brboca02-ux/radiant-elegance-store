// Adapter de pagamento. Implementações activas: Mercado Pago + InfinitPay.
// A criação de preferências/links corre no server (server functions),
// mantendo tokens fora do bundle do client.

import { createMpPreference } from "./mercadopago.functions";
import { createInfinitPayLink } from "./infinitpay.functions";

export type PaymentMethod = "pix" | "cartao" | "boleto" | "infinitpay";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  customer: { name: string; email: string; cpf?: string; phone?: string };
}

export interface CreatePaymentResult {
  provider: string;
  paymentId: string;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}

function currentSiteUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://www.jesstorejoinville.com.br";
}

export const MercadoPagoProvider: PaymentProvider = {
  name: "mercadopago",
  async createPayment(input) {
    const result = await createMpPreference({
      data: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        amount: input.amount,
        method: input.method as "pix" | "cartao" | "boleto",
        siteUrl: currentSiteUrl(),
        customer: input.customer,
      },
    });
    return {
      provider: result.provider,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
    };
  },
};

export const InfinitPayProvider: PaymentProvider = {
  name: "infinitpay",
  async createPayment(input) {
    const result = await createInfinitPayLink({
      data: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        siteUrl: currentSiteUrl(),
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        },
        items: [
          {
            description: `Pedido ${input.orderNumber} — J&S Store`,
            quantity: 1,
            price: input.amount,
          },
        ],
      },
    });
    return {
      provider: result.provider,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
    };
  },
};

// Método de pagamento ativo da loja: InfinitPay (Mercado Pago desativado).
export const payment: PaymentProvider = InfinitPayProvider;

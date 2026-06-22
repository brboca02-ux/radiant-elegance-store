// Adapter de pagamento. Implementação atual é mock (gera ID fake e
// mantém o pedido como `aguardando_pagamento`). Quando você escolher
// Mercado Pago / Asaas / Pagar.me, troque a implementação ativa abaixo.

export type PaymentMethod = "pix" | "cartao" | "boleto";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;     // R$
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

export const MockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createPayment({ orderId, method }) {
    return {
      provider: "mock",
      paymentId: `mock_${orderId.slice(0, 8)}_${Date.now()}`,
      // sem URL — UI mostra "aguardando integração de gateway"
      ...(method === "pix" ? { pixCopyPaste: "" } : {}),
    };
  },
};

export const payment: PaymentProvider = MockPaymentProvider;

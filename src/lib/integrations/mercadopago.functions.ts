// Server function que cria uma preference no Mercado Pago (Checkout Pro).
// Chamada do client via useServerFn/adapter — a chave MP_ACCESS_TOKEN
// permanece server-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["pix", "cartao", "boleto"]),
  siteUrl: z.string().url(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const createMpPreference = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");

    // Restringe métodos conforme escolha do cliente
    const excludedTypes: { id: string }[] = [];
    if (data.method === "pix") {
      excludedTypes.push({ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" });
    } else if (data.method === "cartao") {
      excludedTypes.push({ id: "ticket" }, { id: "atm" }, { id: "bank_transfer" });
    } else if (data.method === "boleto") {
      excludedTypes.push({ id: "credit_card" }, { id: "debit_card" }, { id: "bank_transfer" }, { id: "atm" });
    }

    const [firstName, ...rest] = data.customer.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    const body = {
      items: [
        {
          id: data.orderNumber,
          title: `Pedido ${data.orderNumber} — MD Modas`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(data.amount.toFixed(2)),
        },
      ],
      payer: {
        email: data.customer.email,
        first_name: firstName,
        last_name: lastName,
        ...(data.customer.cpf ? { identification: { type: "CPF", number: data.customer.cpf } } : {}),
        ...(data.customer.phone ? { phone: { number: data.customer.phone } } : {}),
      },
      external_reference: data.orderNumber,
      statement_descriptor: "MD MODAS",
      back_urls: {
        success: `${data.siteUrl}/pedido/sucesso/${data.orderNumber}`,
        pending: `${data.siteUrl}/pedido/sucesso/${data.orderNumber}`,
        failure: `${data.siteUrl}/pedido/sucesso/${data.orderNumber}?erro=pagamento`,
      },
      auto_return: "approved",
      notification_url: `${data.siteUrl}/api/public/payment-webhook`,
      payment_methods: {
        excluded_payment_types: excludedTypes,
        installments: 12,
      },
      metadata: { order_id: data.orderId, order_number: data.orderNumber },
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("MP preference error:", res.status, text);
      throw new Error(`Mercado Pago recusou a preference (${res.status})`);
    }

    const json = (await res.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    // Detecta ambiente pela chave (TEST-... = sandbox)
    const isTest = token.startsWith("TEST-");
    return {
      provider: "mercadopago",
      paymentId: json.id,
      paymentUrl: isTest ? json.sandbox_init_point : json.init_point,
    };
  });

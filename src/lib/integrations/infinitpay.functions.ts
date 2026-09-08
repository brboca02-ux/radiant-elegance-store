// Server function que cria um link de pagamento via InfinitPay Checkout Integrado.
// A chave INFINITPAY_INFINITETAG permanece server-only — nunca exposta ao cliente.
//
// Documentação: https://ajuda.infinitepay.io/pt-BR/articles/10766888-como-usar-o-checkout-da-infinitepay
// Endpoint: POST https://api.checkout.infinitepay.io/links
//
// O fluxo é:
//  1. Cliente finaliza o pedido no nosso checkout
//  2. Criamos o link na InfinitPay (server-side)
//  3. Redirecionamos o cliente para a URL retornada
//  4. InfinitPay redireciona de volta para /pedido/sucesso/:numero
//  5. Webhook confirma o pagamento de forma assíncrona

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  siteUrl: z.string().url(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  address: z
    .object({
      cep: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(), // em reais — convertemos para centavos internamente
    }),
  ),
});

export type InfinitPayInput = z.infer<typeof inputSchema>;

export interface InfinitPayResult {
  provider: "infinitpay";
  paymentId: string; // order_nsu que enviamos
  paymentUrl: string; // URL de checkout da InfinitPay
}

export const createInfinitPayLink = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<InfinitPayResult> => {
    const handle = process.env.INFINITPAY_INFINITETAG;
    if (!handle) throw new Error("INFINITPAY_INFINITETAG não configurado");

    // Segurança: valores SEMPRE relidos do banco — nunca confiamos no cliente.
    const supaUrl = process.env.EXTERNAL_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const supaKey =
      process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !supaKey) throw new Error("Supabase não configurado");

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supaUrl, supaKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: ord, error: ordErr } = await admin
      .from("orders")
      .select("total, status, items:order_items(product_name, unit_price, quantity)")
      .eq("order_number", data.orderNumber)
      .maybeSingle();

    if (ordErr || !ord) throw new Error("Pedido não encontrado");
    if (ord.status !== "aguardando_pagamento")
      throw new Error("Pedido não está aguardando pagamento");

    // Usa os itens do banco em vez dos itens enviados pelo cliente
    const dbItems = (
      ord.items as Array<{ product_name: string; unit_price: number; quantity: number }>
    ).map((i) => ({
      description: i.product_name,
      quantity: i.quantity,
      // InfinitPay recebe valores em centavos (inteiro)
      price: Math.round(Number(i.unit_price) * 100),
    }));

    const body = {
      handle,
      redirect_url: `${data.siteUrl}/pedido/sucesso/${data.orderNumber}?email=${encodeURIComponent(data.customer.email)}`,
      webhook_url: `${data.siteUrl}/api/public/infinitpay-webhook`,
      order_nsu: data.orderNumber,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        ...(data.customer.phone ? { phone_number: data.customer.phone } : {}),
      },
      ...(data.address?.cep
        ? {
            address: {
              cep: data.address.cep.replace(/\D/g, ""),
              number: data.address.number ?? "",
              complement: data.address.complement ?? "",
            },
          }
        : {}),
      items: dbItems,
    };

    const res = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("InfinitPay link error:", res.status, text);
      throw new Error(`InfinitPay recusou o pagamento (${res.status})`);
    }

    const json = (await res.json()) as { url: string };
    if (!json.url) throw new Error("InfinitPay não retornou URL de pagamento");

    return {
      provider: "infinitpay",
      paymentId: data.orderNumber,
      paymentUrl: json.url,
    };
  });

// Verifica o status de um pagamento InfinitPay por polling (fallback manual).
// Útil quando o webhook não chega (ex.: ambiente de desenvolvimento).
export const checkInfinitPayStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderNumber: z.string().min(1),
      transactionNsu: z.string().min(1),
      slug: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const handle = process.env.INFINITPAY_INFINITETAG;
    if (!handle) throw new Error("INFINITPAY_INFINITETAG não configurado");

    const res = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        order_nsu: data.orderNumber,
        transaction_nsu: data.transactionNsu,
        slug: data.slug,
      }),
    });

    if (!res.ok) throw new Error(`InfinitPay check error ${res.status}`);

    const json = (await res.json()) as {
      success: boolean;
      paid: boolean;
      amount: number;
      paid_amount: number;
      capture_method?: string;
    };

    return {
      paid: json.paid,
      amount: json.amount,
      paidAmount: json.paid_amount,
      captureMethod: json.capture_method ?? null,
    };
  });

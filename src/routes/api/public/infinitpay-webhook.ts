// Webhook da InfinitPay — Checkout Integrado.
//
// URL configurada em: INFINITPAY_INFINITETAG + webhook_url no payload de criação do link.
// A InfinitPay envia POST com os dados da transação após pagamento confirmado.
//
// Payload recebido:
// {
//   invoice_slug, amount, paid_amount, installments,
//   capture_method, transaction_nsu, order_nsu,
//   receipt_url, items: [...]
// }
//
// Documentação: https://ajuda.infinitepay.io/pt-BR/articles/10766888-como-usar-o-checkout-da-infinitepay
//
// Segurança:
//   - Validamos que paid_amount >= amount (proteção contra subdesconto)
//   - Comparamos paid_amount com o total real do pedido no banco
//   - Respondemos 200 rapidamente (< 1s) conforme exigido pela InfinitPay
//   - Se responder 400, a InfinitPay tenta reenviar — útil para falhas transitórias

import { createFileRoute } from "@tanstack/react-router";

interface InfinitPayWebhookPayload {
  invoice_slug?: string;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
  transaction_nsu?: string;
  order_nsu?: string;
  receipt_url?: string;
  items?: unknown[];
}

export const Route = createFileRoute("/api/public/infinitpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supaUrl =
          process.env.EXTERNAL_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const supaKey =
          process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY ??
          process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supaUrl || !supaKey) {
          console.error("[InfinitPay webhook] Supabase não configurado");
          return new Response(
            JSON.stringify({ success: false, message: "Configuração interna em falta" }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        let payload: InfinitPayWebhookPayload;
        try {
          payload = (await request.json()) as InfinitPayWebhookPayload;
        } catch {
          return new Response(
            JSON.stringify({ success: false, message: "Payload inválido" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const orderNumber = payload.order_nsu;
        const paidAmount = Number(payload.paid_amount ?? 0);
        const invoiceSlug = payload.invoice_slug ?? "";
        const transactionNsu = payload.transaction_nsu ?? "";
        const captureMethod = payload.capture_method ?? "";

        if (!orderNumber) {
          return new Response(
            JSON.stringify({ success: false, message: "order_nsu em falta" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        // Valor em centavos → reais (InfinitPay envia em centavos)
        const paidAmountBRL = paidAmount / 100;

        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(supaUrl, supaKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Busca o pedido real para validar o valor
        const { data: ord, error: ordErr } = await admin
          .from("orders")
          .select("id, total, status")
          .eq("order_number", orderNumber)
          .maybeSingle();

        if (ordErr || !ord) {
          console.error("[InfinitPay webhook] Pedido não encontrado:", orderNumber);
          return new Response(
            JSON.stringify({ success: false, message: "Pedido não encontrado" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        // Ignora se o pedido já foi processado (idempotência)
        if (ord.status === "pago" || ord.status === "cancelado") {
          return Response.json({ success: true, message: "Pedido já processado" });
        }

        // Valida valor: tolerância de R$ 0,01 para arredondamentos
        const expectedBRL = Number(ord.total);
        if (
          !Number.isFinite(paidAmountBRL) ||
          !Number.isFinite(expectedBRL) ||
          Math.abs(paidAmountBRL - expectedBRL) > 0.01
        ) {
          console.error("[InfinitPay webhook] Valor divergente:", {
            orderNumber,
            expected: expectedBRL,
            received: paidAmountBRL,
          });
          // Não marca como pago mas responde 200 para não gerar reenvio
          return Response.json({
            success: false,
            message: "Divergência de valor — pedido não atualizado",
          });
        }

        // Tudo ok — marca o pedido como pago
        const { error: updateErr } = await admin
          .from("orders")
          .update({
            status: "pago",
            payment_provider: "infinitpay",
            payment_id: transactionNsu || invoiceSlug,
            paid_at: new Date().toISOString(),
          })
          .eq("order_number", orderNumber)
          .eq("status", "aguardando_pagamento");

        if (updateErr) {
          console.error("[InfinitPay webhook] Erro ao actualizar pedido:", updateErr.message);
          // 400 → InfinitPay vai reenviar
          return new Response(
            JSON.stringify({ success: false, message: "Erro ao actualizar pedido" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        console.log("[InfinitPay webhook] Pedido pago:", {
          orderNumber,
          transactionNsu,
          captureMethod,
          paidAmountBRL,
        });

        return Response.json({ success: true, message: null });
      },
    },
  },
});

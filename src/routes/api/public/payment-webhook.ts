// Webhook genérico para confirmação de pagamento.
// Quando o gateway estiver ativo, aponte para:
//   POST https://<seu-dominio>/api/public/payment-webhook
//
// Segurança: valida assinatura HMAC-SHA256 usando o segredo
// PAYMENT_WEBHOOK_SECRET (definir nos secrets do projeto).
// Enquanto o segredo não estiver configurado, o endpoint responde 503.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

interface WebhookPayload {
  orderNumber: string;
  status: "pago" | "cancelado" | "estornado";
  paymentId?: string;
  paymentProvider?: string;
}

export const Route = createFileRoute("/api/public/payment-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYMENT_WEBHOOK_SECRET;
        if (!secret) {
          return new Response(
            JSON.stringify({ error: "Webhook não configurado. Defina PAYMENT_WEBHOOK_SECRET." }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: WebhookPayload;
        try { payload = JSON.parse(body); } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        if (!payload?.orderNumber || !payload?.status) {
          return new Response("Missing fields", { status: 400 });
        }

        // Service role precisa estar configurada via SUPABASE_SERVICE_ROLE_KEY
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          return new Response("Supabase service role not configured", { status: 503 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const update: Record<string, unknown> = { status: payload.status };
        if (payload.status === "pago") update.paid_at = new Date().toISOString();
        if (payload.paymentId) update.payment_id = payload.paymentId;
        if (payload.paymentProvider) update.payment_provider = payload.paymentProvider;

        const { error } = await admin
          .from("orders")
          .update(update)
          .eq("order_number", payload.orderNumber);
        if (error) {
          return new Response(`DB error: ${error.message}`, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});

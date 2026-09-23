import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const webhookSchema = z.object({
  event_id: z.string().max(200).optional(),
  event_type: z.string().max(100).optional(),
  delivery_id: z.string().max(200).optional(),
  id: z.string().max(200).optional(),
  status: z.string().max(80).optional(),
  tracking_url: z.string().url().max(1000).optional(),
  pickup_eta: z.string().max(80).optional(),
  dropoff_eta: z.string().max(80).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

const STATUS_RANK: Record<string, number> = {
  pending: 10, scheduled: 10, pickup: 20, en_route_to_pickup: 20,
  arrived_at_pickup: 30, pickup_complete: 40, en_route_to_dropoff: 50,
  dropoff: 50, arrived_at_dropoff: 60, delivered: 70, completed: 70,
  canceled: 80, failed: 80,
};

function normalized(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export const Route = createFileRoute("/api/public/uber-direct-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["UBER_WEBHOOK_SECRET"];
        if (!secret) return Response.json({ ok: false, message: "Webhook não configurado" }, { status: 503 });
        const raw = await request.text();
        const received = request.headers.get("x-uber-signature")?.replace(/^sha256=/i, "").trim() ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const valid = received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
        if (!valid) return Response.json({ ok: false, message: "Assinatura inválida" }, { status: 401 });

        let parsed: z.infer<typeof webhookSchema>;
        try { parsed = webhookSchema.parse(JSON.parse(raw)); }
        catch { return Response.json({ ok: false, message: "Evento inválido" }, { status: 400 }); }

        const nested = parsed.data ?? {};
        const deliveryId = String(parsed.delivery_id ?? nested["delivery_id"] ?? nested["id"] ?? parsed.id ?? "");
        const status = normalized(parsed.status ?? nested["status"]);
        if (!deliveryId || !status) return Response.json({ ok: false, message: "Evento sem entrega ou status" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .select("id,uber_delivery_status")
          .eq("uber_delivery_id", deliveryId)
          .maybeSingle();
        if (error) return Response.json({ ok: false, message: "Falha interna" }, { status: 500 });
        if (!order) return Response.json({ ok: true, message: "Entrega não vinculada" });

        const current = normalized((order as { uber_delivery_status?: string }).uber_delivery_status);
        if ((STATUS_RANK[status] ?? 0) < (STATUS_RANK[current] ?? 0)) {
          return Response.json({ ok: true, message: "Evento anterior ignorado" });
        }
        const now = new Date().toISOString();
        const trackingUrl = parsed.tracking_url ?? nested["tracking_url"];
        const pickupEta = parsed.pickup_eta ?? nested["pickup_eta"];
        const dropoffEta = parsed.dropoff_eta ?? nested["dropoff_eta"];
        const fulfillment = ["delivered", "completed"].includes(status)
          ? "entregue"
          : ["pickup_complete", "en_route_to_dropoff", "dropoff", "arrived_at_dropoff"].includes(status)
            ? "em_transito"
            : undefined;
        const patch: Record<string, unknown> = {
          uber_delivery_status: status,
          uber_updated_at: now,
          ...(typeof trackingUrl === "string" ? { uber_tracking_url: trackingUrl } : {}),
          ...(typeof pickupEta === "string" ? { uber_pickup_eta: pickupEta } : {}),
          ...(typeof dropoffEta === "string" ? { uber_dropoff_eta: dropoffEta } : {}),
          ...(["failed", "canceled"].includes(status) ? { uber_failure_reason: String(nested["reason"] ?? status).slice(0, 240) } : {}),
          ...(fulfillment ? { fulfillment_status: fulfillment } : {}),
        };
        const { error: updateError } = await supabaseAdmin.from("orders").update(patch).eq("id", order.id);
        if (updateError) return Response.json({ ok: false, message: "Falha interna" }, { status: 500 });
        console.info("[uber-direct webhook] pedido atualizado", { orderId: order.id, status });
        return Response.json({ ok: true });
      },
    },
  },
});
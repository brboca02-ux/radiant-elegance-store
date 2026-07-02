import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { CheckCircle2, MessageCircle, Loader2, Package, Clock, XCircle, RefreshCw } from "lucide-react";
import { getOrderByNumber } from "@/lib/api/supaOrders";
import { getOrderPublic, type PublicOrder } from "@/lib/api/orderTracking";
import { formatPrice, STORE_INFO, buildWhatsAppLink } from "@/lib/shopify";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { FulfillmentStepper } from "@/components/FulfillmentStepper";

const searchSchema = z.object({ email: z.string().email().optional() });

export const Route = createFileRoute("/pedido/sucesso/$numero")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.numero} — MD Modas` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuccessPage,
});

interface OrderView extends PublicOrder {}

function toView(o: Awaited<ReturnType<typeof getOrderByNumber>>): OrderView | null {
  if (!o) return null;
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    fulfillment_status: (o as unknown as { fulfillment_status?: OrderView["fulfillment_status"] }).fulfillment_status ?? null,
    fulfillment_history: (o as unknown as { fulfillment_history?: OrderView["fulfillment_history"] }).fulfillment_history ?? [],
    subtotal: o.subtotal,
    shipping_cost: o.shipping_cost,
    shipping_method: o.shipping_method,
    discount: o.discount,
    total: o.total,
    payment_method: o.payment_method,
    payment_url: o.payment_url,
    tracking_code: o.tracking_code,
    created_at: o.created_at,
    paid_at: o.paid_at,
    address: o.address,
    items: o.items,
  };
}

function statusMeta(s: string) {
  switch (s) {
    case "pago":
      return {
        label: "Pagamento confirmado",
        Icon: CheckCircle2,
        tone: "text-emerald-600",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        desc: "Recebemos a confirmação do Mercado Pago. Vamos preparar seu pedido para envio.",
      };
    case "cancelado":
    case "falhou":
      return {
        label: "Pagamento não concluído",
        Icon: XCircle,
        tone: "text-red-600",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        desc: "O pagamento não foi confirmado. Se precisar de ajuda, fale com a gente pelo WhatsApp.",
      };
    case "estornado":
      return {
        label: "Pagamento estornado",
        Icon: XCircle,
        tone: "text-red-600",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        desc: "O valor foi estornado. Qualquer dúvida, chame no WhatsApp.",
      };
    default:
      return {
        label: "Aguardando pagamento",
        Icon: Clock,
        tone: "text-amber-600",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        desc: "Assim que o Mercado Pago confirmar o pagamento, esta página é atualizada automaticamente.",
      };
  }
}

function SuccessPage() {
  const { numero } = Route.useParams();
  const { email } = Route.useSearch();
  const qc = useQueryClient();

  const { data: order, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["order", numero, email ?? ""],
    queryFn: async (): Promise<OrderView | null> => {
      if (email) return await getOrderPublic(numero, email);
      return toView(await getOrderByNumber(numero));
    },
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      // polling enquanto aguarda pagamento OU enquanto ainda não foi entregue
      if (data.status === "aguardando_pagamento") return 15000;
      if (data.status === "pago" && data.fulfillment_status !== "entregue") return 30000;
      return false;
    },
  });

  // Realtime: escuta updates do pedido pelo order_number
  useEffect(() => {
    const channel = supabase
      .channel(`order-${numero}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `order_number=eq.${numero}` },
        (payload) => {
          const next = payload.new as { status?: string; fulfillment_status?: string | null };
          const prev = payload.old as { status?: string; fulfillment_status?: string | null };
          if (next.status && next.status !== prev.status) {
            if (next.status === "pago") toast.success("Pagamento confirmado!");
            else toast.info("Status do pedido atualizado.");
          } else if (next.fulfillment_status && next.fulfillment_status !== prev.fulfillment_status) {
            toast.success(`Etapa atualizada: ${next.fulfillment_status}`);
          }
          qc.invalidateQueries({ queryKey: ["order", numero, email ?? ""] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [numero, email, qc]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) throw notFound();

  const m = statusMeta(order.status);
  const waMsg = `Olá! Fiz o pedido *${order.order_number}* no site. Pode me ajudar?`;
  const waLink = buildWhatsAppLink(waMsg);
  const showPayCta = order.status === "aguardando_pagamento" && order.payment_url;
  const paid = order.status === "pago";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${m.bg} ${m.tone} mb-4`}>
          <m.Icon className="h-9 w-9" />
        </div>
        <h1 className="font-display text-3xl">
          {order.status === "aguardando_pagamento" ? "Pedido recebido!" : m.label}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Número do pedido: <span className="font-semibold text-foreground">{order.order_number}</span>
        </p>
      </div>

      <div className={`mt-8 border rounded-md p-6 ${m.bg} ${m.border}`}>
        <div className="flex items-start gap-3">
          <m.Icon className={`h-5 w-5 shrink-0 mt-0.5 ${m.tone}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${m.tone}`}>{m.label}</p>
            <p className="text-sm mt-1 text-foreground/80">{m.desc}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {showPayCta && (
                <a
                  href={order.payment_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90"
                >
                  Pagar com Mercado Pago
                </a>
              )}
              <button
                onClick={() => refetch()}
                className="inline-flex items-center justify-center gap-2 border border-border px-4 py-2.5 rounded-md text-sm hover:bg-background/60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Atualizar status
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-md text-sm hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper de fulfillment */}
      <div className="mt-6 border border-border rounded-md p-6 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Preparação do seu pedido</h2>
          {order.tracking_code && (
            <span className="text-[11px] font-medium text-muted-foreground">
              Rastreio: <span className="text-foreground">{order.tracking_code}</span>
            </span>
          )}
        </div>
        <FulfillmentStepper current={order.fulfillment_status} paid={paid} />
        {!paid && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            As etapas aparecem aqui após a confirmação do pagamento.
          </p>
        )}
      </div>

      <div className="mt-6 border border-border rounded-md p-6 space-y-4">
        <h2 className="font-display text-xl flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Resumo
        </h2>
        <div className="divide-y divide-border">
          {order.items.map((i) => (
            <div key={i.id} className="py-3 flex justify-between text-sm">
              <span>
                {i.quantity}× {i.product_name}
                {(i.variant_size || i.variant_color) && (
                  <span className="text-muted-foreground"> · {[i.variant_size, i.variant_color].filter(Boolean).join(" / ")}</span>
                )}
              </span>
              <span>{formatPrice(i.subtotal, "BRL")}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal, "BRL")}</span></div>
          <div className="flex justify-between"><span>Frete ({order.shipping_method ?? "—"})</span><span>{order.shipping_cost === 0 ? "Grátis" : formatPrice(order.shipping_cost, "BRL")}</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t border-border"><span>Total</span><span>{formatPrice(order.total, "BRL")}</span></div>
        </div>
        {order.address && (
          <div className="text-xs text-muted-foreground pt-3 border-t border-border">
            <p className="font-medium text-foreground mb-1">Entrega</p>
            <p>{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
            <p>{order.address.district} · {order.address.city}/{order.address.state} · CEP {order.address.cep}</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center space-y-2">
        <Link to="/pedido/acompanhar" className="block text-sm text-primary hover:underline">
          Consultar outro pedido
        </Link>
        <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para a loja
        </Link>
        <p className="text-xs text-muted-foreground mt-3">
          Dúvidas? {STORE_INFO.city} · {STORE_INFO.phone ?? ""}
        </p>
      </div>
    </div>
  );
}

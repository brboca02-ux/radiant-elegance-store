import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Loader2, Package } from "lucide-react";
import { getOrderByNumber } from "@/lib/api/supaOrders";
import { formatPrice, STORE_INFO, buildWhatsAppLink } from "@/lib/shopify";

export const Route = createFileRoute("/pedido/sucesso/$numero")({
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.numero} — MD Modas` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { numero } = Route.useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", numero],
    queryFn: () => getOrderByNumber(numero),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) throw notFound();

  const waMsg = `Olá! Acabei de fazer o pedido *${order.order_number}* no site. Pode me ajudar com o pagamento?`;
  const waLink = buildWhatsAppLink(waMsg);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="font-display text-3xl">Pedido recebido!</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Número do pedido: <span className="font-semibold text-foreground">{order.order_number}</span>
        </p>
      </div>

      <div className="mt-8 border border-border rounded-md p-6 bg-secondary/20">
        <p className="text-sm">
          Recebemos seu pedido com sucesso. Em breve nossa equipe entrará em contato para
          confirmar o pagamento — gateway de pagamento em integração.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-md w-full sm:w-auto"
        >
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </a>
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

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-primary hover:underline">← Voltar para a loja</Link>
        <p className="text-xs text-muted-foreground mt-3">
          Dúvidas? {STORE_INFO.city} · {STORE_INFO.phone ?? ""}
        </p>
      </div>
    </div>
  );
}

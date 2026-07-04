import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Store, MapPin, Clock, IdCard, Package, MessageCircle, Copy,
  CheckCircle2, Loader2, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { getOrderPublic } from "@/lib/api/orderTracking";
import { getOrderByNumber } from "@/lib/api/supaOrders";
import { STORE_INFO, buildWhatsAppLink } from "@/lib/shopify";

const searchSchema = z.object({ email: z.string().email().optional() });

export const Route = createFileRoute("/pedido/retirada/$numero")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Retirada do pedido ${params.numero} — MD Modas` },
      { name: "description", content: "Instruções para retirar seu pedido na loja MD Modas em Joinville/SC." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PickupInstructionsPage,
});

const HOURS = [
  { d: "Segunda a Sexta", h: "09h às 18h30" },
  { d: "Sábado", h: "09h às 13h" },
  { d: "Domingo e feriados", h: "Fechado" },
];

function PickupInstructionsPage() {
  const { numero } = Route.useParams();
  const { email } = Route.useSearch();

  const { data: order, isLoading } = useQuery({
    queryKey: ["pickup-order", numero, email ?? ""],
    queryFn: async () => {
      if (email) return await getOrderPublic(numero, email);
      const o = await getOrderByNumber(numero);
      return o
        ? {
            order_number: o.order_number,
            status: o.status,
            fulfillment_status: (o as unknown as { fulfillment_status?: string | null }).fulfillment_status ?? null,
            customer: o.customer ? { name: o.customer.name } : null,
          }
        : null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) throw notFound();

  const isReady = order.fulfillment_status === "embalado" || order.fulfillment_status === "coletado";
  const isDone = order.fulfillment_status === "entregue";
  const waMsg = `Olá MD Modas! Quero retirar o pedido *${order.order_number}* na loja. Já está pronto?`;
  const waLink = buildWhatsAppLink(waMsg);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/pedido/acompanhar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl">Retirar na loja</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Pedido <span className="font-semibold text-foreground">{order.order_number}</span>
          {order.customer?.name ? ` · ${order.customer.name}` : ""}
        </p>

        {isDone ? (
          <p className="inline-flex items-center gap-1.5 mt-3 text-xs bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 rounded-full px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Retirada concluída
          </p>
        ) : isReady ? (
          <p className="inline-flex items-center gap-1.5 mt-3 text-xs bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 rounded-full px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Pronto para retirar
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 mt-3 text-xs bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 rounded-full px-3 py-1">
            <Clock className="h-3.5 w-3.5" /> Estamos preparando seu pedido
          </p>
        )}
      </div>

      {/* Código do pedido */}
      <div className="mt-6 border-2 border-dashed border-primary/40 rounded-md p-5 bg-primary/5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary mb-2">
          📌 Apresente este código na loja
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[180px] font-mono text-lg font-bold tracking-wider bg-background border border-border rounded px-3 py-2 text-center select-all">
            {order.order_number}
          </code>
          <button
            onClick={copyCode}
            className="inline-flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-md text-xs font-medium hover:bg-background"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar
          </button>
        </div>
      </div>

      {/* Endereço */}
      <div className="mt-6 rounded-md border border-border overflow-hidden bg-background">
        <div className="p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" /> Endereço da loja
          </h2>
          <p className="text-sm font-medium">{STORE_INFO.name}</p>
          <p className="text-sm text-muted-foreground">{STORE_INFO.street}</p>
          <p className="text-sm text-muted-foreground">
            {STORE_INFO.city} — {STORE_INFO.region} · CEP {STORE_INFO.postalCode}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Telefone: {STORE_INFO.phone}</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${STORE_INFO.street}, ${STORE_INFO.city}, ${STORE_INFO.region}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> Traçar rota no Google Maps
          </a>
        </div>
        <iframe
          title="Mapa MD Modas"
          src={STORE_INFO.mapsEmbed}
          className="w-full h-56 border-t border-border"
          loading="lazy"
        />
      </div>

      {/* Horários */}
      <div className="mt-6 rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" /> Horário de atendimento
        </h2>
        <ul className="text-sm divide-y divide-border">
          {HOURS.map((h) => (
            <li key={h.d} className="flex justify-between py-2">
              <span className="text-muted-foreground">{h.d}</span>
              <span className="font-medium">{h.h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* O que trazer */}
      <div className="mt-6 rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <IdCard className="h-4 w-4 text-primary" /> O que trazer
        </h2>
        <ul className="text-sm space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Documento com foto (RG ou CNH) do titular do pedido.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Número do pedido: <strong>{order.order_number}</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Se outra pessoa for retirar, envie autorização com foto do documento do titular.</span>
          </li>
        </ul>
      </div>

      {/* Como funciona */}
      <div className="mt-6 rounded-md border border-border bg-background p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-primary" /> Como funciona
        </h2>
        <ol className="text-sm space-y-2 list-decimal ml-5">
          <li>Assim que seu pedido estiver embalado, você recebe um aviso.</li>
          <li>Vá até a loja no horário de atendimento com o código e o documento.</li>
          <li>Nossa equipe confere e libera a retirada em minutos.</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Prefere confirmar antes de ir? Chame no WhatsApp que a gente avisa quando estiver pronto.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </a>
        <Link
          to="/pedido/sucesso/$numero"
          params={{ numero: order.order_number }}
          search={email ? { email } : {}}
          className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-md text-sm hover:bg-muted"
        >
          Ver status completo
        </Link>
      </div>
    </div>
  );
}

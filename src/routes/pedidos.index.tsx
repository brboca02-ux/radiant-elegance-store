import { AdminShell } from "@/components/AdminShell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Eye, Printer, XCircle } from "lucide-react";
import {
  useOrdersStore, ORDER_STATUS_LABEL, statusTone, fmtBRL, fmtDate,
  type OrderStatus,
} from "@/stores/ordersStore";

export const Route = createFileRoute("/pedidos/")({
  head: () => ({
    meta: [
      { title: "Pedidos — MD Modas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrdersListPage,
});

const STATUS_OPTIONS: ("todos" | OrderStatus)[] = [
  "todos", "novo", "pago", "separando", "enviado", "entregue", "cancelado",
];

function OrdersListPage() {
  const orders = useOrdersStore((s) => s.orders);
  const cancel = useOrdersStore((s) => s.cancel);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"todos" | OrderStatus>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        if (status !== "todos" && o.status !== status) return false;
        if (q) {
          const s = q.toLowerCase();
          if (!o.number.toLowerCase().includes(s) &&
              !o.customer.name.toLowerCase().includes(s) &&
              !o.customer.email.toLowerCase().includes(s)) return false;
        }
        if (from && new Date(o.created_at) < new Date(from)) return false;
        if (to && new Date(o.created_at) > new Date(to + "T23:59:59")) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [orders, q, status, from, to]);

  const kpis = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === todayStr);
    return {
      total: orders.length,
      hoje: todayOrders.length,
      aguardando: orders.filter((o) => o.status === "pago" || o.status === "separando").length,
      faturamento: todayOrders.filter((o) => o.status !== "cancelado").reduce((a, o) => a + o.total, 0),
    };
  }, [orders]);

  return (
    <AdminShell active="pedidos">
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Operação</p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Pedidos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão completa de vendas da loja</p>
          </div>
          <Link to="/dashboard" className="text-xs font-medium text-primary hover:underline">← Dashboard</Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi label="Total" value={String(kpis.total)} />
          <Kpi label="Pedidos Hoje" value={String(kpis.hoje)} />
          <Kpi label="Aguardando envio" value={String(kpis.aguardando)} />
          <Kpi label="Faturamento Hoje" value={fmtBRL(kpis.faturamento)} />
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-border bg-background p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Número, cliente ou e-mail…"
              className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm"
            />
          </div>
          <select
            value={status} onChange={(e) => setStatus(e.target.value as never)}
            className="h-10 w-full rounded-md border border-border bg-background text-sm px-3"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "todos" ? "Todos status" : ORDER_STATUS_LABEL[s as OrderStatus]}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            aria-label="Data inicial"
            className="h-10 w-full rounded-md border border-border bg-background text-sm px-2 sm:col-start-1 lg:col-start-auto" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            aria-label="Data final"
            className="h-10 w-full rounded-md border border-border bg-background text-sm px-2" />
        </div>

        {/* Tabela desktop */}
        <div className="hidden md:block rounded-xl border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Pedido</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-right px-4 py-3 font-medium">Itens</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Pagamento</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{o.number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-right">{o.items.reduce((a, i) => a + i.quantity, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtBRL(o.total)}</td>
                  <td className="px-4 py-3 capitalize text-xs">{o.payment_method} · <span className="text-muted-foreground">{o.payment_status}</span></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusTone[o.status]}`}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/pedidos/$id" params={{ id: o.id }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Link>
                      {o.status !== "cancelado" && o.status !== "entregue" && (
                        <button
                          onClick={() => confirm(`Cancelar pedido ${o.number}?`) && cancel(o.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-rose-600 hover:bg-rose-50">
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((o) => (
            <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }}
              className="block rounded-xl border border-border bg-background p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{o.number}</div>
                  <div className="text-xs text-muted-foreground">{o.customer.name}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusTone[o.status]}`}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">{fmtDate(o.created_at)}</span>
                <span className="font-semibold">{fmtBRL(o.total)}</span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">Nenhum pedido encontrado.</p>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Estrutura preparada para Stripe, Pix, Cartão, WhatsApp e Webhooks. <Printer className="inline h-3 w-3" /> Imprimir disponível no detalhe.
        </p>
      </div>
    </div>
    </AdminShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

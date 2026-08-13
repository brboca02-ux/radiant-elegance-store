import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft, MessageCircle, Download, Save, ShoppingBag, Mail, Phone,
  Calendar, MessageSquare,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCustomersStore, fmtBRL, fmtDate, fmtDateTime, statusTone, statusLabel,
  whatsAppHref, customerToCsv,
} from "@/stores/customersStore";
import { useOrdersStore, ORDER_STATUS_LABEL } from "@/stores/ordersStore";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — J&S Store" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const customer = useCustomersStore((s) => s.customers.find((c) => c.id === id));
  const update = useCustomersStore((s) => s.update);
  const addMessage = useCustomersStore((s) => s.addMessage);
  const orders = useOrdersStore((s) =>
    s.orders.filter((o) => o.customer.id === id || o.customer.email === customer?.email),
  );

  const [form, setForm] = useState(() => ({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    whatsapp: customer?.whatsapp ?? "",
    notes: customer?.notes ?? "",
  }));
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  if (!customer) {
    return (
      <AdminShell active="clientes">
        <div className="max-w-[900px] mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground mb-4">Cliente não encontrado.</p>
          <Button onClick={() => navigate({ to: "/clientes" })}>Voltar</Button>
        </div>
      </AdminShell>
    );
  }

  const ticket = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;
  const totalFromOrders = orders.reduce((s, o) => s + o.total, 0);

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    update(customer.id, form);
    setSavedAt(new Date().toLocaleTimeString("pt-BR"));
  };

  const onSendMsg = () => {
    if (!draft.trim()) return;
    addMessage(customer.id, { channel: "whatsapp", direction: "out", body: draft.trim(), user_id: "admin" });
    setDraft("");
  };

  return (
    <AdminShell active="clientes">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar para clientes
        </Link>

        {/* Header */}
        <div className="rounded-xl border border-border bg-background p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center font-display text-xl">
                {customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-tight">{customer.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.whatsapp}</span>
                  <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${statusTone[customer.status]}`}>
                    {statusLabel[customer.status]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={whatsAppHref(customer.whatsapp, `Olá ${customer.name.split(" ")[0]}!`)} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([customerToCsv(customer)], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `cliente-${customer.id}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Kpi label="Pedidos" value={String(customer.total_orders)} />
            <Kpi label="Total gasto" value={fmtBRL(customer.total_spent)} />
            <Kpi label="Última compra" value={fmtDate(customer.last_order_at)} />
            <Kpi label="Cliente desde" value={fmtDate(customer.created_at)} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="compras">Compras</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          </TabsList>

          {/* Dados */}
          <TabsContent value="dados" className="mt-4">
            <form onSubmit={onSave} className="rounded-xl border border-border bg-background p-6 space-y-4 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Cadastro">
                  <Input value={fmtDate(customer.created_at)} disabled />
                </Field>
              </div>
              <Field label="Notas internas">
                <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferências, observações…" />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit"><Save className="h-4 w-4" /> Salvar</Button>
                {savedAt && <span className="text-xs text-muted-foreground">Salvo às {savedAt}</span>}
              </div>
            </form>
          </TabsContent>

          {/* Compras */}
          <TabsContent value="compras" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Kpi label="Pedidos" value={String(orders.length || customer.total_orders)} />
              <Kpi label="Valor total" value={fmtBRL(totalFromOrders || customer.total_spent)} />
              <Kpi label="Ticket médio" value={fmtBRL(ticket || (customer.total_orders ? customer.total_spent / customer.total_orders : 0))} />
            </div>
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                  Nenhum pedido encontrado para este cliente.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground text-left">
                    <tr>
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Itens</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          <Link to="/pedidos/$id" params={{ id: o.id }} className="hover:underline">{o.number}</Link>
                        </td>
                        <td className="px-4 py-3">{fmtDate(o.created_at)}</td>
                        <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                        <td className="px-4 py-3">{ORDER_STATUS_LABEL[o.status]}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmtBRL(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Mensagens */}
          <TabsContent value="mensagens" className="mt-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Histórico de contatos
                </p>
                <span className="text-[11px] text-muted-foreground">Pronto para Evolution API</span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto p-2">
                {customer.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhuma mensagem ainda.</p>
                )}
                {customer.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      m.direction === "out" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p>{m.body}</p>
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${m.direction === "out" ? "opacity-80" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3" /> {fmtDateTime(m.created_at)} · {m.channel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSendMsg(); }}
                  placeholder="Registrar mensagem enviada…"
                />
                <Button onClick={onSendMsg} disabled={!draft.trim()}>Registrar</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-display text-lg mt-1">{value}</p>
    </div>
  );
}

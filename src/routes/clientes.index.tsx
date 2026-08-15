import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Search, MessageCircle, Eye, Download } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCustomersStore, fmtBRL, fmtDate, statusTone, statusLabel,
  whatsAppHref, customerToCsv,
} from "@/stores/customersStore";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — J&S Store" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ClientesPage,
});

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ClientesPage() {
  const customers = useCustomersStore((s) => s.customers);
  const loading = useCustomersStore((s) => s.loading);
  const hydrate = useCustomersStore((s) => s.hydrate);
  const [q, setQ] = useState("");
  const [field, setField] = useState<"all" | "name" | "whatsapp" | "email">("all");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => {
      const checks: Record<typeof field, boolean> = {
        all: [c.name, c.email, c.whatsapp].some((v) => v.toLowerCase().includes(term)),
        name: c.name.toLowerCase().includes(term),
        whatsapp: c.whatsapp.toLowerCase().includes(term),
        email: c.email.toLowerCase().includes(term),
      };
      return checks[field];
    });
  }, [customers, q, field]);

  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.total_orders, 0);
  const vip = customers.filter((c) => c.status === "vip").length;

  const exportAll = () => {
    const header = "id,nome,email,whatsapp,status,pedidos,total_gasto,ultima_compra,cadastro";
    const rows = filtered.map((c) =>
      [c.id, c.name, c.email, c.whatsapp, statusLabel[c.status], c.total_orders,
        c.total_spent.toFixed(2), fmtDate(c.last_order_at), fmtDate(c.created_at)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    downloadCsv("clientes.csv", [header, ...rows].join("\n"));
  };

  return (
    <AdminShell active="clientes">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">CRM</p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">Base de compradores, histórico e relacionamento</p>
          </div>
          <Button variant="outline" onClick={exportAll}><Download className="h-4 w-4" /> Exportar CSV</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Kpi label="Clientes" value={String(customers.length)} />
          <Kpi label="Clientes VIP" value={String(vip)} />
          <Kpi label="Pedidos totais" value={String(totalOrders)} />
          <Kpi label="Faturamento" value={fmtBRL(totalSpent)} />
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-border bg-background p-4 mb-4 grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" className="pl-9 w-full" />
          </div>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as typeof field)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">Todos os campos</option>
            <option value="name">Nome</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3 hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 hidden md:table-cell">Última compra</th>
                    <th className="px-4 py-3 text-right">Total gasto</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link to="/clientes/$id" params={{ id: c.id }} className="hover:underline">{c.name}</Link>
                        <div className="text-xs text-muted-foreground">{c.total_orders} pedidos</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{c.whatsapp}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{fmtDate(c.last_order_at)}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtBRL(c.total_spent)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${statusTone[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <a
                            href={whatsAppHref(c.whatsapp, `Olá ${c.name.split(" ")[0]}!`)}
                            target="_blank" rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-emerald-600 hover:bg-emerald-50"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <Link
                            to="/clientes/$id" params={{ id: c.id }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                            title="Ver ficha"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => downloadCsv(`cliente-${c.id}.csv`, customerToCsv(c))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                            title="Exportar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}

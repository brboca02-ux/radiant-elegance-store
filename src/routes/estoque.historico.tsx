import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Settings2 } from "lucide-react";
import { useStockStore, type MovementType } from "@/stores/stockStore";
import { useProductsStore } from "@/stores/productsStore";

export const Route = createFileRoute("/estoque/historico")({
  head: () => ({ meta: [{ title: "Histórico de Estoque — MD Modas" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const movements = useStockStore((s) => s.movements);
  const products = useProductsStore((s) => s.products);

  const [productId, setProductId] = useState("all");
  const [type, setType] = useState<"all" | MovementType>("all");
  const [date, setDate] = useState("");

  const rows = useMemo(() => {
    return movements
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .filter((m) => (productId === "all" ? true : m.product_id === productId))
      .filter((m) => (type === "all" ? true : m.type === type))
      .filter((m) => (date ? m.created_at.startsWith(date) : true));
  }, [movements, productId, type, date]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <Link to="/estoque" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar para estoque
        </Link>

        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Operação</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Histórico de Movimentações</h1>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Todos produtos</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as "all" | MovementType)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Todos tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </div>

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Produto</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                  <th className="px-4 py-3 text-left font-medium">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium">Observação</th>
                  <th className="px-4 py-3 text-left font-medium">Usuário</th>
                  <th className="px-4 py-3 text-right font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{m.product_name}</td>
                    <td className="px-4 py-3"><TypePill type={m.type} /></td>
                    <td className={`px-4 py-3 text-right font-medium ${m.type === "saida" ? "text-rose-600" : m.type === "entrada" ? "text-emerald-600" : "text-foreground"}`}>
                      {m.type === "ajuste" ? `= ${m.quantity}` : m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.notes || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.user_name}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypePill({ type }: { type: MovementType }) {
  const map = {
    entrada: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: ArrowDownCircle, label: "Entrada" },
    saida: { cls: "bg-rose-50 text-rose-700 ring-rose-200", Icon: ArrowUpCircle, label: "Saída" },
    ajuste: { cls: "bg-blue-50 text-blue-700 ring-blue-200", Icon: Settings2, label: "Ajuste" },
  }[type];
  const Icon = map.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map.cls}`}>
      <Icon className="h-3 w-3" /> {map.label}
    </span>
  );
}

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Settings2, AlertTriangle, History, Search } from "lucide-react";
import { useProductsStore, CATEGORIES, stockLevel, stockStatusLabel } from "@/stores/productsStore";
import { useStockStore, type MovementType } from "@/stores/stockStore";

export const Route = createFileRoute("/estoque/")({
  head: () => ({ meta: [{ title: "Estoque — MD Modas" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: EstoquePage,
});

function EstoquePage() {
  const products = useProductsStore((s) => s.products);
  const record = useStockStore((s) => s.record);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [openType, setOpenType] = useState<MovementType | null>(null);

  const rows = useMemo(() => {
    return products
      .filter((p) => p.status !== "arquivado")
      .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((p) => (cat === "all" ? true : p.category_id === cat))
      .map((p) => ({ ...p, level: stockLevel(p), available: Math.max(0, p.stock - (p.reserved_stock || 0)) }))
      .filter((p) => (statusF === "all" ? true : p.level === statusF));
  }, [products, q, cat, statusF]);

  const counters = useMemo(() => {
    const all = products.filter((p) => p.status !== "arquivado");
    return {
      total: all.length,
      critical: all.filter((p) => stockLevel(p) === "critico").length,
      low: all.filter((p) => stockLevel(p) === "baixo").length,
      out: all.filter((p) => stockLevel(p) === "esgotado").length,
    };
  }, [products]);

  return (
    <AdminShell active="produtos" tabs={[{ label: "Produtos", to: "/produtos" }, { label: "Categorias", to: "/categorias" }, { label: "Estoque", to: "/estoque" }]}>
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Operação</p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Estoque</h1>
            <p className="text-sm text-muted-foreground mt-1">Controle de inventário · loja store_md_modas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setOpenType("entrada")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-700">
              <ArrowDownCircle className="h-4 w-4" /> Entrada
            </button>
            <button onClick={() => setOpenType("saida")} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-rose-700">
              <ArrowUpCircle className="h-4 w-4" /> Saída
            </button>
            <button onClick={() => setOpenType("ajuste")} className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/85">
              <Settings2 className="h-4 w-4" /> Ajuste
            </button>
            <Link to="/estoque/historico" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted">
              <History className="h-4 w-4" /> Histórico
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI label="Produtos" value={counters.total} />
          <KPI label="Crítico (0-2)" value={counters.critical} accent="text-rose-600" />
          <KPI label="Estoque Baixo" value={counters.low} accent="text-amber-600" />
          <KPI label="Esgotados" value={counters.out} accent="text-muted-foreground" />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-background p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome ou SKU…"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Todas categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Todos status</option>
            <option value="normal">Em Estoque</option>
            <option value="baixo">Estoque Baixo</option>
            <option value="critico">Crítico</option>
            <option value="esgotado">Esgotado</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Produto</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Atual</th>
                  <th className="px-4 py-3 text-right font-medium">Reservado</th>
                  <th className="px-4 py-3 text-right font-medium">Disponível</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden ring-1 ring-border shrink-0">
                          {p.images[0] && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">SKU {p.sku || "—"} · mín. {p.minimum_stock}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{CATEGORIES.find((c) => c.id === p.category_id)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.stock}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.reserved_stock || 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.available}</td>
                    <td className="px-4 py-3"><LevelPill level={p.level} /></td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openType && (
        <MovementDialog
          type={openType}
          onClose={() => setOpenType(null)}
          onSubmit={(payload) => {
            const m = record(payload);
            if (m) {
              toast.success("Movimentação registrada");
              setOpenType(null);
            } else {
              toast.error("Produto inválido");
            }
          }}
        />
      )}
    </div>
    </AdminShell>
  );
}

function KPI({ label, value, accent = "text-foreground" }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

function LevelPill({ level }: { level: ReturnType<typeof stockLevel> }) {
  const map: Record<string, { cls: string; dot: string }> = {
    normal: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
    baixo: { cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
    critico: { cls: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
    esgotado: { cls: "bg-muted text-muted-foreground ring-border", dot: "bg-muted-foreground" },
  };
  const m = map[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {stockStatusLabel(level)}
    </span>
  );
}

function MovementDialog({
  type, onClose, onSubmit,
}: {
  type: MovementType;
  onClose: () => void;
  onSubmit: (p: { product_id: string; type: MovementType; quantity: number; reason: string; notes?: string }) => void;
}) {
  const products = useProductsStore((s) => s.products.filter((p) => p.status !== "arquivado"));
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number>(type === "ajuste" ? 0 : 1);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const reasons = type === "entrada"
    ? ["Compra fornecedor", "Devolução cliente", "Transferência entrada"]
    : type === "saida"
    ? ["Venda balcão", "Perda/avaria", "Transferência saída"]
    : ["Contagem física", "Correção sistema", "Inventário"];

  const titles: Record<MovementType, string> = {
    entrada: "Registrar Entrada", saida: "Registrar Saída", ajuste: "Ajuste de Estoque",
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">{titles[type]}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {type === "ajuste" ? "Define o novo total absoluto de estoque." : "A quantidade será somada/subtraída do estoque atual."}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Produto">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inp}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — atual: {p.stock}</option>)}
            </select>
          </Field>
          <Field label={type === "ajuste" ? "Novo total" : "Quantidade"}>
            <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inp} />
          </Field>
          <Field label="Motivo">
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={inp}>
              <option value="">Selecionar…</option>
              {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Observação (opcional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inp} />
          </Field>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
          <button
            onClick={() => productId && onSubmit({ product_id: productId, type, quantity, reason, notes })}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/85"
            disabled={!productId || quantity < 0}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

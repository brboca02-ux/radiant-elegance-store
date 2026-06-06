import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Package, AlertTriangle, DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MD Modas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

// ---------- MOCK DATA (replace with Supabase queries later) ----------
// Multi-tenant ready: every record carries store_id.
const MOCK_STORE_ID = "store_md_modas";

const kpis = [
  { label: "Vendas Hoje", value: "R$ 2.480,00", delta: "+12%", icon: DollarSign, accent: "text-emerald-600" },
  { label: "Pedidos Hoje", value: "18", delta: "+4", icon: ShoppingBag, accent: "text-blue-600" },
  { label: "Produtos Ativos", value: "127", delta: "+3", icon: Package, accent: "text-violet-600" },
  { label: "Estoque Baixo", value: "9", delta: "atenção", icon: AlertTriangle, accent: "text-amber-600" },
];

const recentOrders = [
  { id: "#1042", store_id: MOCK_STORE_ID, customer: "Mariana Silva", total: "R$ 289,90", status: "Pago", at: "há 12 min" },
  { id: "#1041", store_id: MOCK_STORE_ID, customer: "João Pereira", total: "R$ 149,90", status: "Pendente", at: "há 38 min" },
  { id: "#1040", store_id: MOCK_STORE_ID, customer: "Camila Souza", total: "R$ 459,80", status: "Pago", at: "há 1 h" },
  { id: "#1039", store_id: MOCK_STORE_ID, customer: "Ana Beatriz", total: "R$ 99,90", status: "Enviado", at: "há 2 h" },
  { id: "#1038", store_id: MOCK_STORE_ID, customer: "Roberto Lima", total: "R$ 329,70", status: "Pago", at: "há 3 h" },
];

const lowStock = [
  { sku: "VST-AUR-M", store_id: MOCK_STORE_ID, name: "Vestido Aurora — M", qty: 2 },
  { sku: "CJT-CLA-G", store_id: MOCK_STORE_ID, name: "Conjunto Classic — G", qty: 1 },
  { sku: "BLU-ELE-P", store_id: MOCK_STORE_ID, name: "Blusa Elegance — P", qty: 3 },
  { sku: "CAL-WID-38", store_id: MOCK_STORE_ID, name: "Calça Wide Leg — 38", qty: 2 },
];

const recentLeads = [
  { id: "l_01", store_id: MOCK_STORE_ID, name: "Patrícia M.", contact: "patricia@email.com", source: "Newsletter", at: "há 20 min" },
  { id: "l_02", store_id: MOCK_STORE_ID, name: "—", contact: "+55 47 9 9123-4567", source: "WhatsApp", at: "há 1 h" },
  { id: "l_03", store_id: MOCK_STORE_ID, name: "Luana R.", contact: "luana@email.com", source: "Popup", at: "há 3 h" },
  { id: "l_04", store_id: MOCK_STORE_ID, name: "—", contact: "carlos@email.com", source: "Rodapé", at: "ontem" },
];

const monthly = {
  revenue: "R$ 58.940,00",
  orders: 312,
  ticket: "R$ 188,90",
  conversion: "2,4%",
};
// ---------------------------------------------------------------------

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    Pago: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pendente: "bg-amber-50 text-amber-700 ring-amber-200",
    Enviado: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[s] ?? "bg-muted text-foreground ring-border"}`}>
      {s}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-background p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, hint, to }: { title: string; hint?: string; to?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ver tudo <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Painel da loja</p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Visão geral · loja {MOCK_STORE_ID}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Atualizado agora · dados de demonstração
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, delta, icon: Icon, accent }) => (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                  <p className={`mt-1 text-xs font-medium ${accent}`}>{delta}</p>
                </div>
                <div className={`rounded-lg bg-muted p-2 ${accent}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <Card className="lg:col-span-2">
            <SectionHeader title="Pedidos Recentes" hint="Últimas vendas registradas" />
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Pedido</th>
                    <th className="px-2 py-2 font-medium">Cliente</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium text-right">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-2 py-3 font-medium">{o.id}</td>
                      <td className="px-2 py-3 text-muted-foreground">{o.customer}</td>
                      <td className="px-2 py-3">{o.total}</td>
                      <td className="px-2 py-3"><StatusPill s={o.status} /></td>
                      <td className="px-2 py-3 text-right text-xs text-muted-foreground">{o.at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Monthly summary */}
          <Card>
            <SectionHeader title="Resumo Mensal" hint="Mês atual" />
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Faturamento</div>
                <div className="font-semibold">{monthly.revenue}</div>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBag className="h-4 w-4" /> Pedidos</div>
                <div className="font-semibold">{monthly.orders}</div>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-sm text-muted-foreground">Ticket Médio</div>
                <div className="font-semibold">{monthly.ticket}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Conversão</div>
                <div className="font-semibold">{monthly.conversion}</div>
              </div>
            </div>
          </Card>

          {/* Low stock */}
          <Card className="lg:col-span-2">
            <SectionHeader title="Produtos com Estoque Baixo" hint="Reposição recomendada" />
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <li key={p.sku} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">SKU {p.sku}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" /> {p.qty} un.
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Leads */}
          <Card>
            <SectionHeader title="Leads Recentes" hint="Capturas dos últimos dias" />
            <ul className="divide-y divide-border">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-start justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.contact}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-border">
                      <Users className="h-3 w-3" /> {l.source}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">{l.at}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Fundação multiempresa · todas as tabelas carregarão <code className="font-mono">store_id</code> ao conectar Lovable Cloud.
        </p>
      </div>
    </div>
  );
}

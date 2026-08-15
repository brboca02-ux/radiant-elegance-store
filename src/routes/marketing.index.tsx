import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Mail, Ticket, Users } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { loadLeads, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/marketing/")({
  head: () => ({ meta: [{ title: "Marketing — J&S Store" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: MarketingPage,
});

type Tab = "leads" | "cupons" | "newsletter";

function MarketingPage() {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => { loadLeads().then(setLeads); }, []);

  const newsletterLeads = leads.filter((l) => (l.source ?? l.type) !== "whatsapp");

  return (
    <AdminShell active="marketing">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Crescimento</p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Marketing</h1>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {[
            { k: "leads" as Tab, label: "Leads", icon: Users },
            { k: "cupons" as Tab, label: "Cupons", icon: Ticket },
            { k: "newsletter" as Tab, label: "Newsletter", icon: Mail },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "leads" && (
          <div className="rounded-xl border border-border bg-background">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Leads capturados ({leads.length})</h2>
            </div>
            <ul className="divide-y divide-border">
              {leads.length === 0 && <li className="p-6 text-sm text-muted-foreground">Nenhum lead ainda.</li>}
              {leads.map((l, i) => {
                const contato = l.email || l.whatsapp || l.value || "";
                const origem = l.source ?? l.type ?? "newsletter";
                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="uppercase text-[10px] tracking-widest text-muted-foreground w-24">{origem}</span>
                    <span className="flex-1 truncate">{l.name ? `${l.name} · ` : ""}{contato}</span>
                    <span className="text-xs text-muted-foreground">{new Date(l.at).toLocaleDateString("pt-BR")}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "cupons" && (
          <div className="rounded-xl border border-border bg-background p-10 text-center">
            <Ticket className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum cupom criado ainda. Em breve você poderá emitir cupons promocionais por aqui.
            </p>
          </div>
        )}

        {tab === "newsletter" && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="font-semibold mb-2">Inscritos na newsletter</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Total: {newsletterLeads.length} contatos
            </p>
            <ul className="divide-y divide-border max-h-96 overflow-auto">
              {newsletterLeads.map((l, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span className="truncate">{l.email || l.value}</span>
                  <span className="text-xs text-muted-foreground">{new Date(l.at).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

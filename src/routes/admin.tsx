import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_SITE_CONFIG,
  loadSiteConfig,
  saveSiteConfig,
  type SiteConfig,
} from "@/lib/siteConfig";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel — MD Modas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPanel,
});

type Lead = { type: "email" | "whatsapp"; value: string; at: string };

function Field({
  label,
  value,
  onChange,
  textarea,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </label>
  );
}

function AdminPanel() {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setCfg(loadSiteConfig());
    try {
      setLeads(JSON.parse(localStorage.getItem("md_leads_v1") ?? "[]"));
    } catch {
      setLeads([]);
    }
  }, []);

  const update = <K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const save = () => {
    saveSiteConfig(cfg);
    toast.success("Conteúdo atualizado em todo o site.");
  };

  const reset = () => {
    setCfg(DEFAULT_SITE_CONFIG);
    saveSiteConfig(DEFAULT_SITE_CONFIG);
    toast.success("Conteúdo restaurado para o padrão.");
  };

  const exportLeads = () => {
    const csv = ["tipo,contato,data", ...leads.map((l) => `${l.type},${l.value},${l.at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "md-modas-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl">Painel MD Modas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edite banners, promoções e textos da home sem alterar código. As mudanças são salvas neste dispositivo.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Hero / Banner principal</h2>
        <Field label="Etiqueta" value={cfg.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
        <Field label="Título" value={cfg.heroTitle} onChange={(v) => update("heroTitle", v)} />
        <Field label="Subtítulo" value={cfg.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} textarea />
        <Field label="Texto do botão" value={cfg.heroCta} onChange={(v) => update("heroCta", v)} />
      </section>

      <section className="space-y-4 mt-10">
        <h2 className="font-display text-xl">Promoção da semana</h2>
        <Field label="Título" value={cfg.promoTitle} onChange={(v) => update("promoTitle", v)} />
        <Field label="Subtítulo" value={cfg.promoSubtitle} onChange={(v) => update("promoSubtitle", v)} />
        <Field label="Código do cupom" value={cfg.promoCoupon} onChange={(v) => update("promoCoupon", v.toUpperCase())} />
        <Field
          label="Desconto (%)"
          type="number"
          value={cfg.promoCouponPercent}
          onChange={(v) => update("promoCouponPercent", Number(v) || 0)}
        />
      </section>

      <section className="space-y-4 mt-10">
        <h2 className="font-display text-xl">Newsletter</h2>
        <Field label="Título" value={cfg.newsletterTitle} onChange={(v) => update("newsletterTitle", v)} />
        <Field label="Subtítulo" value={cfg.newsletterSubtitle} onChange={(v) => update("newsletterSubtitle", v)} textarea />
      </section>

      <section className="space-y-4 mt-10">
        <h2 className="font-display text-xl">CTA WhatsApp</h2>
        <Field label="Título" value={cfg.whatsappCtaTitle} onChange={(v) => update("whatsappCtaTitle", v)} />
        <Field label="Subtítulo" value={cfg.whatsappCtaSubtitle} onChange={(v) => update("whatsappCtaSubtitle", v)} />
      </section>

      <div className="flex flex-wrap gap-3 mt-10">
        <button onClick={save} className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-semibold">
          Salvar alterações
        </button>
        <button onClick={reset} className="border border-border rounded-md px-5 py-2.5 text-sm">
          Restaurar padrão
        </button>
      </div>

      <section className="mt-14 border-t border-border pt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Leads capturados ({leads.length})</h2>
          <button onClick={exportLeads} disabled={!leads.length} className="text-sm font-semibold text-primary disabled:opacity-40">
            Exportar CSV
          </button>
        </div>
        <ul className="text-sm space-y-1 max-h-72 overflow-auto border border-border rounded-md p-3 bg-offwhite">
          {leads.length === 0 && <li className="text-muted-foreground">Nenhum lead capturado ainda.</li>}
          {leads.map((l, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="text-muted-foreground uppercase text-[10px] tracking-widest">{l.type}</span>
              <span className="flex-1">{l.value}</span>
              <span className="text-muted-foreground">{new Date(l.at).toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

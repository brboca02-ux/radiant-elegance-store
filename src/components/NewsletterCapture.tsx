import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Check } from "lucide-react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "md_leads_v1";

type Lead = { type: "email" | "whatsapp"; value: string; at: string };

function saveLead(lead: Lead) {
  try {
    const list: Lead[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    list.push(lead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

export function NewsletterCapture({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().slice(0, 254);
    const cleanPhone = phone.replace(/[^\d+]/g, "").slice(0, 16);
    if (!cleanEmail && !cleanPhone) {
      toast.error("Informe seu e-mail ou WhatsApp.");
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      toast.error("E-mail inválido.");
      return;
    }
    if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 10) {
      toast.error("WhatsApp inválido.");
      return;
    }
    if (cleanEmail) saveLead({ type: "email", value: cleanEmail, at: new Date().toISOString() });
    if (cleanPhone) saveLead({ type: "whatsapp", value: cleanPhone, at: new Date().toISOString() });
    track.lead(cleanEmail && cleanPhone ? "email+whatsapp" : cleanEmail ? "email" : "whatsapp");
    setDone(true);
    toast.success("Cadastro confirmado", {
      description: "Você receberá nossos lançamentos e novidades em primeira mão.",
    });
  };


  if (done) {
    return (
      <div className={`text-center ${compact ? "" : "py-8"}`}>
        <Check className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
        <p className="font-display text-xl mt-3">Cadastro confirmado</p>
        <p className="text-sm text-muted-foreground mt-2">
          Você receberá nossos lançamentos em primeira mão.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-2" : "space-y-3"}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="relative">
        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-foreground text-background rounded-md py-2.5 text-sm font-semibold tracking-wide hover:bg-foreground/90 transition"
      >
        Quero receber novidades
      </button>
    </form>
  );
}

export function NewsletterSection() {
  return (
    <section className="py-20 md:py-24 bg-offwhite border-t border-border">
      <div className="max-w-xl mx-auto px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Newsletter MD Modas</p>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mt-4 tracking-tight">
          Lançamentos em primeira mão
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed">
          Receba lançamentos, novidades e tendências da MD Modas direto no seu e-mail.
        </p>
        <div className="mt-8">
          <NewsletterCapture />
        </div>
      </div>
    </section>
  );
}

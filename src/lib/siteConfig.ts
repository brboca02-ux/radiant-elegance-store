import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCoupon: string;
  promoCouponPercent: number;
  newsletterTitle: string;
  newsletterSubtitle: string;
  whatsappCtaTitle: string;
  whatsappCtaSubtitle: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  heroEyebrow: "Nova Coleção",
  heroTitle: "J&S Store",
  heroSubtitle: "Moda feminina e masculina para todas as ocasiões.",
  heroCta: "Comprar Agora",
  promoTitle: "Ofertas da Semana",
  promoSubtitle: "Aproveite descontos exclusivos até domingo",
  promoCoupon: "BEMVINDA5",
  promoCouponPercent: 5,
  newsletterTitle: "Lançamentos em primeira mão",
  newsletterSubtitle: "Receba novidades, recebidos da semana e tendências da J&S Store direto no seu e-mail.",
  whatsappCtaTitle: "Precisa de ajuda para escolher?",
  whatsappCtaSubtitle: "Fale com uma consultora J&S Store pelo WhatsApp.",
};

const STORAGE_KEY = "md_site_config_v1";

export async function loadSiteConfig(): Promise<SiteConfig> {
  // Use localStorage as the source for now since we cannot create new tables
  // but we provide an async interface to make it feel like a backend.
  if (typeof window === "undefined") return DEFAULT_SITE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(cfg: SiteConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("md:site-config"));
}

export function useSiteConfig(): SiteConfig {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  useEffect(() => {
    loadSiteConfig().then(setCfg);
    const handler = () => loadSiteConfig().then(setCfg);
    window.addEventListener("md:site-config", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("md:site-config", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return cfg;
}

// Editable site content (admin panel writes to localStorage).
// Defaults live here; admins override via /admin without code changes.
import { useEffect, useState } from "react";

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
  heroSubtitle: "Confirmar que o controle de estoque funciona por variante e que o status muda corretamente quando o estoque atingir o mínimo definido.\n\nVerificar a vitrine e o painel de admin para confirmar que os 17 produtos aparecem com preço, categoria, tamanhos e imagens corretos.\ntirar os estoques da md modas",
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

export function loadSiteConfig(): SiteConfig {
  if (typeof window === "undefined") return DEFAULT_SITE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export function saveSiteConfig(cfg: SiteConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("md:site-config"));
}

export function useSiteConfig(): SiteConfig {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  useEffect(() => {
    setCfg(loadSiteConfig());
    const handler = () => setCfg(loadSiteConfig());
    window.addEventListener("md:site-config", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("md:site-config", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return cfg;
}

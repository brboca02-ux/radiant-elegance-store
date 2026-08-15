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

const CONFIG_KEY = "global_config";

export async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const { data, error } = await supabase
      .from("site_config" as any)
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error || !data) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...(data.value as any) };
  } catch (e) {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(cfg: SiteConfig) {
  const { error } = await supabase
    .from("site_config" as any)
    .upsert({ 
      key: CONFIG_KEY, 
      value: cfg as any, 
      updated_at: new Date().toISOString() 
    }, { onConflict: "key" });
  
  if (error) throw error;
}

export function useSiteConfig(): SiteConfig {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    loadSiteConfig().then(setCfg);

    const channel = supabase
      .channel("site-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        (payload) => {
          if ((payload.new as any)?.key === CONFIG_KEY) {
            setCfg({ ...DEFAULT_SITE_CONFIG, ...((payload.new as any).value) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return cfg;
}

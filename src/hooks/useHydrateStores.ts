import { useEffect } from "react";
import { supabase, isSupabaseAvailable } from "@/integrations/supabase/client";
import { useProductsStore } from "@/stores/productsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useStockStore } from "@/stores/stockStore";

/**
 * Carrega produtos, categorias e movimentações de estoque do Supabase
 * no primeiro mount e mantém a lista de produtos sincronizada ao vivo
 * (Realtime) para que vitrine e painel reflitam mudanças sem recarregar.
 * Falha silenciosamente se as credenciais do Supabase não estiverem disponíveis.
 */
export function useHydrateStores() {
  useEffect(() => {
    if (!isSupabaseAvailable()) return;
    void useProductsStore.getState().hydrate().catch(console.error);
    void useCategoriesStore.getState().hydrate().catch(console.error);
    void useStockStore.getState().hydrate().catch(console.error);
  }, []);

  useEffect(() => {
    if (!isSupabaseAvailable()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void useProductsStore.getState().refresh().catch(console.error);
      }, 400);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("live-products")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refreshSoon)
        .on("postgres_changes", { event: "*", schema: "public", table: "product_images" }, refreshSoon)
        .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, refreshSoon)
        .subscribe();
    } catch (e) {
      console.error("[useHydrateStores] Realtime subscription failed:", e);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel).catch(console.error);
    };
  }, []);
}

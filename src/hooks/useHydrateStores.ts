import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProductsStore } from "@/stores/productsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useStockStore } from "@/stores/stockStore";

/**
 * Carrega produtos, categorias e movimentações de estoque do Supabase
 * no primeiro mount e mantém a lista de produtos sincronizada ao vivo
 * (Realtime) para que vitrine e painel reflitam mudanças sem recarregar.
 */
export function useHydrateStores() {
  useEffect(() => {
    void useProductsStore.getState().hydrate();
    void useCategoriesStore.getState().hydrate();
    void useStockStore.getState().hydrate();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void useProductsStore.getState().refresh();
      }, 400);
    };

    const channel = supabase
      .channel("live-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_images" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, refreshSoon)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, []);
}

import { useEffect } from "react";
import { useProductsStore } from "@/stores/productsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";

/**
 * Carrega produtos e categorias do Supabase no primeiro mount.
 * Garante que a vitrine e o painel admin compartilhem a mesma fonte de dados.
 */
export function useHydrateStores() {
  useEffect(() => {
    void useProductsStore.getState().hydrate();
    void useCategoriesStore.getState().hydrate();
  }, []);
}

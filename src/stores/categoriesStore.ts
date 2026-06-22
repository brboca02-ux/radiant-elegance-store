import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const STORE_ID = "store_md_modas";

export type CategoryStatus = "ativo" | "inativo" | "arquivado";

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  hover_image: string;
  sort_order: number;
  featured: boolean;
  show_home: boolean;
  show_menu: boolean;
  show_menu_mobile: boolean;
  status: CategoryStatus;
  meta_title: string;
  meta_description: string;
  product_count: number; // mock — will be derived from products later
  created_at: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const uid = () => Math.random().toString(36).slice(2, 10);

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;

const seed: Category[] = [];

interface CategoriesState {
  categories: Category[];
  create: (c: Omit<Category, "id" | "store_id" | "created_at" | "product_count">) => Category;
  update: (id: string, patch: Partial<Category>) => void;
  archive: (id: string) => void;
  remove: (id: string) => void;
}

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set) => ({
      categories: seed,
      create: (c) => {
        const cat: Category = {
          ...c, id: "c_" + uid(), store_id: STORE_ID, product_count: 0,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ categories: [...s.categories, cat].sort((a, b) => a.sort_order - b.sort_order) }));
        return cat;
      },
      update: (id, patch) => set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c))
          .sort((a, b) => a.sort_order - b.sort_order),
      })),
      archive: (id) => set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, status: "arquivado" } : c)),
      })),
      remove: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
    }),
    { name: "md_categories_v2", storage: createJSONStorage(() => localStorage) },
  ),
);

export const emptyCategory = (): Omit<Category, "id" | "store_id" | "created_at" | "product_count"> => ({
  name: "", slug: "", description: "", image: "", hover_image: "",
  sort_order: 99, featured: false, show_home: true, show_menu: true, show_menu_mobile: true,
  status: "ativo", meta_title: "", meta_description: "",
});

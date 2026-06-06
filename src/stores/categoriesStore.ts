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

const seed: Category[] = [
  {
    id: "c_001", store_id: STORE_ID, name: "Feminino", slug: "feminino",
    description: "Peças femininas selecionadas para o dia a dia.",
    image: img("1485518882345-15568b007407"), hover_image: img("1539109136881-3be0616acf4b"),
    sort_order: 1, featured: true, show_home: true, show_menu: true, show_menu_mobile: true, status: "ativo",
    meta_title: "Moda Feminina — MD Modas", meta_description: "Coleção feminina selecionada em Joinville.",
    product_count: 12, created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "c_002", store_id: STORE_ID, name: "Masculino", slug: "masculino",
    description: "Camisas, polos e bermudas para o dia a dia.",
    image: img("1602810318383-e386cc2a3ccf"), hover_image: "",
    sort_order: 2, featured: false, show_home: true, show_menu: true, show_menu_mobile: true, status: "ativo",
    meta_title: "Moda Masculina — MD Modas", meta_description: "Coleção masculina em Joinville.",
    product_count: 6, created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "c_003", store_id: STORE_ID, name: "Vestidos", slug: "vestidos",
    description: "Vestidos para todas as ocasiões.",
    image: img("1496747611176-843222e1e57c"), hover_image: "",
    sort_order: 3, featured: true, show_home: true, show_menu: true, show_menu_mobile: true, status: "ativo",
    meta_title: "Vestidos — MD Modas", meta_description: "Vestidos midi, longos e curtos.",
    product_count: 8, created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: "c_004", store_id: STORE_ID, name: "Conjuntos", slug: "conjuntos",
    description: "Conjuntos coordenados em duas peças.",
    image: img("1551488831-00ddcb6c6bd3"), hover_image: "",
    sort_order: 4, featured: false, show_home: true, show_menu: true, show_menu_mobile: true, status: "ativo",
    meta_title: "Conjuntos — MD Modas", meta_description: "Conjuntos modernos e versáteis.",
    product_count: 5, created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "c_005", store_id: STORE_ID, name: "Plus Size", slug: "plus-size",
    description: "Modelagem confortável para todos os corpos.",
    image: img("1515886657613-9f3515b0c78f"), hover_image: "",
    sort_order: 5, featured: false, show_home: true, show_menu: true, show_menu_mobile: true, status: "ativo",
    meta_title: "Plus Size — MD Modas", meta_description: "Coleção plus size em Joinville.",
    product_count: 4, created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

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
    { name: "md_categories_v1", storage: createJSONStorage(() => localStorage) },
  ),
);

export const emptyCategory = (): Omit<Category, "id" | "store_id" | "created_at" | "product_count"> => ({
  name: "", slug: "", description: "", image: "", hover_image: "",
  sort_order: 99, featured: false, show_home: true, show_menu: true, show_menu_mobile: true,
  status: "ativo", meta_title: "", meta_description: "",
});

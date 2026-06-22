import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const STORE_ID = "store_md_modas";

export const CATEGORIES = [
  { id: "feminino", name: "Feminino" },
  { id: "masculino", name: "Masculino" },
  { id: "vestidos", name: "Vestidos" },
  { id: "conjuntos", name: "Conjuntos" },
  { id: "plus-size", name: "Plus Size" },
] as const;

export const SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;
export type Size = (typeof SIZES)[number];

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: Size | string;
  color: string;
  stock: number;
}

export type ProductStatus = "ativo" | "inativo" | "arquivado";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  brand: string;
  sku: string;
  price: number;
  sale_price: number | null;
  stock: number;
  reserved_stock: number;
  minimum_stock: number;
  track_stock: boolean;
  weight: number;
  status: ProductStatus;
  meta_title: string;
  meta_description: string;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const uid = () => Math.random().toString(36).slice(2, 10);

const mkImg = (product_id: string, url: string, position: number, is_primary = false): ProductImage => ({
  id: uid(), product_id, url, position, is_primary,
});

const placeholderImg = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;

const baseProduct = {
  reserved_stock: 0, minimum_stock: 5, track_stock: true,
};

const seed: Product[] = [];

interface ProductsState {
  products: Product[];
  list: () => Product[];
  get: (id: string) => Product | undefined;
  create: (p: Omit<Product, "id" | "store_id" | "created_at">) => Product;
  update: (id: string, p: Partial<Product>) => void;
  duplicate: (id: string) => Product | undefined;
  archive: (id: string) => void;
  remove: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  setStock: (id: string, value: number) => void;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: seed,
      list: () => get().products,
      get: (id) => get().products.find((p) => p.id === id),
      create: (p) => {
        const newProduct: Product = {
          ...p, id: "p_" + uid(), store_id: STORE_ID,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ products: [newProduct, ...s.products] }));
        return newProduct;
      },
      update: (id, patch) => set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
      duplicate: (id) => {
        const orig = get().products.find((p) => p.id === id);
        if (!orig) return undefined;
        const copy: Product = {
          ...orig, id: "p_" + uid(),
          name: orig.name + " (cópia)", slug: orig.slug + "-copia",
          sku: orig.sku + "-COPY", created_at: new Date().toISOString(),
        };
        set((s) => ({ products: [copy, ...s.products] }));
        return copy;
      },
      archive: (id) => set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, status: "arquivado" } : p)),
      })),
      remove: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      adjustStock: (id, delta) => set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
      })),
      setStock: (id, value) => set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, value) } : p)),
      })),
    }),
    { name: "md_products_v10", storage: createJSONStorage(() => localStorage) },
  ),
);

export const emptyProduct = (): Omit<Product, "id" | "store_id" | "created_at"> => ({
  name: "", slug: "", description: "", category_id: "feminino", brand: "MD Modas",
  sku: "", price: 0, sale_price: null, stock: 0, reserved_stock: 0,
  minimum_stock: 5, track_stock: true, weight: 0, status: "ativo",
  meta_title: "", meta_description: "", images: [], variants: [],
});

// ---------- Stock helpers ----------
export type StockLevel = "critico" | "baixo" | "normal" | "esgotado";

export function stockLevel(p: Pick<Product, "stock" | "minimum_stock" | "track_stock">): StockLevel {
  if (!p.track_stock) return "normal";
  if (p.stock <= 0) return "esgotado";
  if (p.stock <= 2) return "critico";
  if (p.stock <= (p.minimum_stock || 5)) return "baixo";
  return "normal";
}

export function stockStatusLabel(level: StockLevel): string {
  return level === "esgotado" ? "Esgotado"
    : level === "critico" ? "Crítico"
    : level === "baixo" ? "Estoque Baixo"
    : "Em Estoque";
}

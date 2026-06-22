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

const seed: Product[] = [
  {
    id: "p_001", store_id: STORE_ID, name: "Vestido Aurora", slug: "vestido-aurora",
    description: "Vestido midi com caimento fluido, ideal para ocasiões especiais.",
    category_id: "vestidos", brand: "MD Modas", sku: "VST-AUR",
    price: 229.9, sale_price: 189.9, stock: 12, weight: 0.4, status: "ativo",
    ...baseProduct, reserved_stock: 2,
    meta_title: "Vestido Aurora — MD Modas", meta_description: "Vestido midi elegante para ocasiões especiais.",
    images: [
      mkImg("p_001", placeholderImg("1539109136881-3be0616acf4b"), 0, true),
      mkImg("p_001", placeholderImg("1515372039744-b8f02a3ae446"), 1),
    ],
    variants: [
      { id: uid(), product_id: "p_001", size: "P", color: "Preto", stock: 4 },
      { id: uid(), product_id: "p_001", size: "M", color: "Preto", stock: 5 },
      { id: uid(), product_id: "p_001", size: "G", color: "Vinho", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "p_002", store_id: STORE_ID, name: "Blusa Elegance", slug: "blusa-elegance",
    description: "Blusa versátil para o dia a dia, ideal para compor produções modernas.",
    category_id: "feminino", brand: "MD Modas", sku: "BLU-ELE",
    price: 99.9, sale_price: null, stock: 4, weight: 0.2, status: "ativo",
    ...baseProduct,
    meta_title: "Blusa Elegance — MD Modas", meta_description: "Blusa elegante e confortável.",
    images: [mkImg("p_002", placeholderImg("1485518882345-15568b007407"), 0, true)],
    variants: [
      { id: uid(), product_id: "p_002", size: "P", color: "Branco", stock: 1 },
      { id: uid(), product_id: "p_002", size: "M", color: "Branco", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "p_003", store_id: STORE_ID, name: "Conjunto Classic", slug: "conjunto-classic",
    description: "Conjunto alfaiataria em duas peças com corte moderno.",
    category_id: "conjuntos", brand: "MD Modas", sku: "CJT-CLA",
    price: 329.9, sale_price: 289.9, stock: 2, weight: 0.7, status: "ativo",
    ...baseProduct, reserved_stock: 1,
    meta_title: "Conjunto Classic — MD Modas", meta_description: "Conjunto alfaiataria moderno.",
    images: [mkImg("p_003", placeholderImg("1551488831-00ddcb6c6bd3"), 0, true)],
    variants: [
      { id: uid(), product_id: "p_003", size: "M", color: "Bege", stock: 1 },
      { id: uid(), product_id: "p_003", size: "G", color: "Bege", stock: 1 },
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "p_004", store_id: STORE_ID, name: "Camisa Casual", slug: "camisa-casual",
    description: "Camisa masculina de algodão para uso casual.",
    category_id: "masculino", brand: "MD Modas", sku: "CAM-CAS",
    price: 149.9, sale_price: null, stock: 15, weight: 0.3, status: "ativo",
    ...baseProduct,
    meta_title: "Camisa Casual — MD Modas", meta_description: "Camisa masculina confortável.",
    images: [mkImg("p_004", placeholderImg("1602810318383-e386cc2a3ccf"), 0, true)],
    variants: [
      { id: uid(), product_id: "p_004", size: "M", color: "Azul", stock: 7 },
      { id: uid(), product_id: "p_004", size: "G", color: "Azul", stock: 8 },
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "p_005", store_id: STORE_ID, name: "Vestido Plus Elegance", slug: "vestido-plus-elegance",
    description: "Vestido plus size com modelagem confortável e elegante.",
    category_id: "plus-size", brand: "MD Modas", sku: "VST-PLU",
    price: 259.9, sale_price: null, stock: 0, weight: 0.5, status: "inativo",
    ...baseProduct,
    meta_title: "Vestido Plus Elegance", meta_description: "Vestido plus size elegante.",
    images: [mkImg("p_005", placeholderImg("1496747611176-843222e1e57c"), 0, true)],
    variants: [],
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "p_006", store_id: STORE_ID, name: "Cropped Terracota", slug: "cropped-terracota",
    description: "Cropped em sarja terracota com alças largas e detalhe de botões frontais. Modelagem ajustada ao corpo.",
    category_id: "feminino", brand: "MD Modas", sku: "CRP-TER",
    price: 89.9, sale_price: 69.9, stock: 8, weight: 0.2, status: "ativo",
    ...baseProduct,
    meta_title: "Cropped Terracota — MD Modas", meta_description: "Cropped terracota com alças e botões.",
    images: [mkImg("p_006", "/__l5e/assets-v1/1d6e2807-f16a-42fc-bb26-0a331ccce87c/cropped-terracota.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_006", size: "P", color: "Terracota", stock: 3 },
      { id: uid(), product_id: "p_006", size: "M", color: "Terracota", stock: 3 },
      { id: uid(), product_id: "p_006", size: "G", color: "Terracota", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p_007", store_id: STORE_ID, name: "Conjunto Tie Dye", slug: "conjunto-tie-dye",
    description: "Conjunto em tecido tie dye, confortável e estiloso. Disponível em três estampas exclusivas.",
    category_id: "conjuntos", brand: "MD Modas", sku: "CJT-TDY",
    price: 159.9, sale_price: 129.9, stock: 9, weight: 0.5, status: "ativo",
    ...baseProduct,
    meta_title: "Conjunto Tie Dye — MD Modas", meta_description: "Conjunto tie dye estiloso e confortável.",
    images: [mkImg("p_007", "/__l5e/assets-v1/1738a724-bb5b-462c-a4d8-f29933d5695b/conjuntos-tiedye.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_007", size: "P", color: "Branco", stock: 3 },
      { id: uid(), product_id: "p_007", size: "M", color: "Vermelho", stock: 3 },
      { id: uid(), product_id: "p_007", size: "M", color: "Marrom", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "p_008", store_id: STORE_ID, name: "Camiseta Esportiva Vermelha", slug: "camiseta-esportiva-vermelha",
    description: "Camiseta básica de algodão em vermelho intenso. Caimento confortável para o dia a dia ou esporte.",
    category_id: "masculino", brand: "MD Modas", sku: "CAM-VER",
    price: 79.9, sale_price: null, stock: 20, weight: 0.25, status: "ativo",
    ...baseProduct,
    meta_title: "Camiseta Vermelha — MD Modas", meta_description: "Camiseta básica vermelha em algodão.",
    images: [mkImg("p_008", "/__l5e/assets-v1/94b0d593-2624-40b6-b49b-f9e6ff66cbfe/camiseta-vermelha.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_008", size: "P", color: "Vermelho", stock: 5 },
      { id: uid(), product_id: "p_008", size: "M", color: "Vermelho", stock: 8 },
      { id: uid(), product_id: "p_008", size: "G", color: "Vermelho", stock: 7 },
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

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
    { name: "md_products_v2", storage: createJSONStorage(() => localStorage) },
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

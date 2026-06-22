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
    id: "p_001", store_id: STORE_ID, name: "Calça Legging Preta", slug: "calca-legging-preta",
    description: "Calça legging em tecido suplex de alta compressão. Modelagem cintura alta, confortável e versátil para o dia a dia ou treino.",
    category_id: "feminino", brand: "MD Modas", sku: "CAL-LEG-PRT",
    price: 119.9, sale_price: 89.9, stock: 15, weight: 0.3, status: "ativo",
    ...baseProduct,
    meta_title: "Calça Legging Preta — MD Modas", meta_description: "Calça legging preta de alta compressão.",
    images: [mkImg("p_001", "/__l5e/assets-v1/17e0e891-96b1-405e-bf34-f90b6dbde8fe/calca-preta.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_001", size: "P", color: "Preto", stock: 5 },
      { id: uid(), product_id: "p_001", size: "M", color: "Preto", stock: 6 },
      { id: uid(), product_id: "p_001", size: "G", color: "Preto", stock: 4 },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p_002", store_id: STORE_ID, name: "Pantalona Lotus Bordada", slug: "pantalona-lotus-bordada",
    description: "Pantalona em viscose off-white com bordado floral em preto. Cintura com elástico e cordão, caimento fluido e elegante.",
    category_id: "feminino", brand: "MD Modas", sku: "PAN-LOT-OFF",
    price: 229.9, sale_price: 189.9, stock: 8, weight: 0.4, status: "ativo",
    ...baseProduct,
    meta_title: "Pantalona Lotus Bordada — MD Modas", meta_description: "Pantalona off-white com bordado floral lotus.",
    images: [mkImg("p_002", "/__l5e/assets-v1/dabcbe2e-0d4a-47fc-b989-be44bd309437/pantalona-lotus.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_002", size: "P", color: "Off-white", stock: 3 },
      { id: uid(), product_id: "p_002", size: "M", color: "Off-white", stock: 3 },
      { id: uid(), product_id: "p_002", size: "G", color: "Off-white", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "p_003", store_id: STORE_ID, name: "Legging Tie Dye Marrom", slug: "legging-tiedye-marrom",
    description: "Legging seamless com efeito tie dye em tons de marrom e preto. Detalhe vazado lateral com franjas, modelagem push up.",
    category_id: "feminino", brand: "MD Modas", sku: "LEG-TDY-MAR",
    price: 159.9, sale_price: 129.9, stock: 10, weight: 0.3, status: "ativo",
    ...baseProduct,
    meta_title: "Legging Tie Dye Marrom — MD Modas", meta_description: "Legging tie dye marrom com franjas laterais.",
    images: [mkImg("p_003", "/__l5e/assets-v1/e8a0e862-7567-4eda-91a1-0e13444da7ea/legging-tiedye-marrom.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_003", size: "P", color: "Marrom", stock: 4 },
      { id: uid(), product_id: "p_003", size: "M", color: "Marrom", stock: 4 },
      { id: uid(), product_id: "p_003", size: "G", color: "Marrom", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "p_004", store_id: STORE_ID, name: "Bermuda Masculina Verde Militar", slug: "bermuda-masc-verde-militar",
    description: "Bermuda masculina em moletinho verde militar, com bolsos zíper, cordão de ajuste e detalhes em alto relevo.",
    category_id: "masculino", brand: "MD Modas", sku: "BER-MAS-VRD",
    price: 109.9, sale_price: 89.9, stock: 12, weight: 0.35, status: "ativo",
    ...baseProduct,
    meta_title: "Bermuda Masculina Verde Militar — MD Modas", meta_description: "Bermuda esportiva verde militar masculina.",
    images: [mkImg("p_004", "/__l5e/assets-v1/9c64939a-0b37-45da-a2e4-076c156bee9f/bermuda-masc-verde.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_004", size: "M", color: "Verde Militar", stock: 4 },
      { id: uid(), product_id: "p_004", size: "G", color: "Verde Militar", stock: 5 },
      { id: uid(), product_id: "p_004", size: "GG", color: "Verde Militar", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "p_005", store_id: STORE_ID, name: "Short Alfaiataria Marrom", slug: "short-alfaiataria-marrom",
    description: "Short de alfaiataria cintura alta em marrom, com passantes e botões frontais encapados. Caimento estruturado e elegante.",
    category_id: "feminino", brand: "MD Modas", sku: "SHO-ALF-MAR",
    price: 139.9, sale_price: null, stock: 9, weight: 0.25, status: "ativo",
    ...baseProduct,
    meta_title: "Short Alfaiataria Marrom — MD Modas", meta_description: "Short de alfaiataria marrom cintura alta.",
    images: [mkImg("p_005", "/__l5e/assets-v1/983fcc47-05e2-4a1a-a068-7dae7cb87c6c/short-alfaiataria-marrom.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_005", size: "P", color: "Marrom", stock: 3 },
      { id: uid(), product_id: "p_005", size: "M", color: "Marrom", stock: 4 },
      { id: uid(), product_id: "p_005", size: "G", color: "Marrom", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "p_006", store_id: STORE_ID, name: "Blusa Linho Palmeira", slug: "blusa-linho-palmeira",
    description: "Blusa em linho cru com bordado de palmeira na manga e acabamento em crochê na gola e punhos. Caimento leve e fresco.",
    category_id: "feminino", brand: "MD Modas", sku: "BLU-LIN-PAL",
    price: 139.9, sale_price: 119.9, stock: 8, weight: 0.2, status: "ativo",
    ...baseProduct,
    meta_title: "Blusa Linho Palmeira — MD Modas", meta_description: "Blusa de linho cru com bordado palmeira.",
    images: [mkImg("p_006", "/__l5e/assets-v1/daefdb78-c65d-41b4-b9f3-75f0e2a1897b/blusa-linho-palmeira.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_006", size: "P", color: "Cru", stock: 3 },
      { id: uid(), product_id: "p_006", size: "M", color: "Cru", stock: 3 },
      { id: uid(), product_id: "p_006", size: "G", color: "Cru", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "p_007", store_id: STORE_ID, name: "Calça Alfaiataria Caramelo", slug: "calca-alfaiataria-caramelo",
    description: "Calça de alfaiataria caramelo, cintura alta com passantes e botão encapado. Modelagem reta, ideal para looks elegantes.",
    category_id: "feminino", brand: "MD Modas", sku: "CAL-ALF-CAR",
    price: 199.9, sale_price: 169.9, stock: 10, weight: 0.45, status: "ativo",
    ...baseProduct,
    meta_title: "Calça Alfaiataria Caramelo — MD Modas", meta_description: "Calça de alfaiataria caramelo cintura alta.",
    images: [mkImg("p_007", "/__l5e/assets-v1/3d811835-dc83-4dcd-9414-b378febd5cb9/calca-alfaiataria-caramelo.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_007", size: "P", color: "Caramelo", stock: 3 },
      { id: uid(), product_id: "p_007", size: "M", color: "Caramelo", stock: 4 },
      { id: uid(), product_id: "p_007", size: "G", color: "Caramelo", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p_008", store_id: STORE_ID, name: "Calça Cargo Marrom", slug: "calca-cargo-marrom",
    description: "Calça cargo em sarja marrom com bolsos laterais utilitários. Modelagem ampla e confortável, estilo street.",
    category_id: "feminino", brand: "MD Modas", sku: "CAL-CAR-MAR",
    price: 179.9, sale_price: null, stock: 9, weight: 0.5, status: "ativo",
    ...baseProduct,
    meta_title: "Calça Cargo Marrom — MD Modas", meta_description: "Calça cargo marrom com bolsos utilitários.",
    images: [mkImg("p_008", "/__l5e/assets-v1/9776cd84-28ba-406b-b8fb-93fd5ee607f4/calca-cargo-marrom.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_008", size: "P", color: "Marrom", stock: 3 },
      { id: uid(), product_id: "p_008", size: "M", color: "Marrom", stock: 3 },
      { id: uid(), product_id: "p_008", size: "G", color: "Marrom", stock: 3 },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "p_009", store_id: STORE_ID, name: "T-Shirt Preta Estampada", slug: "tshirt-preta-estampada",
    description: "T-Shirts pretas em algodão com estampas exclusivas: Cowgirl, Be Yourself e Hearts. Caimento confortável e versátil.",
    category_id: "feminino", brand: "MD Modas", sku: "TSH-PRT-EST",
    price: 79.9, sale_price: 64.9, stock: 18, weight: 0.2, status: "ativo",
    ...baseProduct,
    meta_title: "T-Shirt Preta Estampada — MD Modas", meta_description: "T-shirts pretas com estampas exclusivas.",
    images: [mkImg("p_009", "/__l5e/assets-v1/d972c145-ca13-4f6f-8d89-6758bd0b0ee1/tshirts-pretas-estampadas.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_009", size: "P", color: "Cowgirl", stock: 6 },
      { id: uid(), product_id: "p_009", size: "M", color: "Be Yourself", stock: 6 },
      { id: uid(), product_id: "p_009", size: "G", color: "Hearts", stock: 6 },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "p_010", store_id: STORE_ID, name: "T-Shirt Let's Go Girls", slug: "tshirt-lets-go-girls",
    description: "T-Shirt branca com estampa country 'Let's Go Girls' e chapéu cowboy. Algodão macio, perfeita para o dia a dia.",
    category_id: "feminino", brand: "MD Modas", sku: "TSH-LGG",
    price: 79.9, sale_price: null, stock: 12, weight: 0.2, status: "ativo",
    ...baseProduct,
    meta_title: "T-Shirt Let's Go Girls — MD Modas", meta_description: "T-shirt branca estampa country cowboy.",
    images: [mkImg("p_010", "/__l5e/assets-v1/27f806c0-91c2-4f50-af30-438535b09f1b/tshirt-lets-go-girls.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_010", size: "P", color: "Branco", stock: 4 },
      { id: uid(), product_id: "p_010", size: "M", color: "Branco", stock: 4 },
      { id: uid(), product_id: "p_010", size: "G", color: "Branco", stock: 4 },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "p_011", store_id: STORE_ID, name: "Conjunto Moletom Cinza", slug: "conjunto-moletom-cinza",
    description: "Conjunto de moletom cinza mescla com capuz e ajuste em cordão. Calça jogger com bolsos e elástico. Conforto premium.",
    category_id: "masculino", brand: "MD Modas", sku: "CJT-MOL-CZA",
    price: 249.9, sale_price: 199.9, stock: 7, weight: 0.9, status: "ativo",
    ...baseProduct,
    meta_title: "Conjunto Moletom Cinza — MD Modas", meta_description: "Conjunto moletom cinza com capuz e jogger.",
    images: [mkImg("p_011", "/__l5e/assets-v1/ec2ce521-b1ec-47fb-8de1-8100bd9fff16/conjunto-moletom-cinza.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_011", size: "M", color: "Cinza", stock: 2 },
      { id: uid(), product_id: "p_011", size: "G", color: "Cinza", stock: 3 },
      { id: uid(), product_id: "p_011", size: "GG", color: "Cinza", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "p_012", store_id: STORE_ID, name: "Camisa Richelieu Off-White", slug: "camisa-richelieu-offwhite",
    description: "Camisa em viscose off-white com bordado richelieu nos ombros. Gola padre, mangas bufantes. Romântica e sofisticada.",
    category_id: "feminino", brand: "MD Modas", sku: "CAM-RIC-OFF",
    price: 219.9, sale_price: 179.9, stock: 6, weight: 0.3, status: "ativo",
    ...baseProduct,
    meta_title: "Camisa Richelieu Off-White — MD Modas", meta_description: "Camisa off-white com bordado richelieu.",
    images: [mkImg("p_012", "/__l5e/assets-v1/9c2d5fb9-4744-47c3-bfe3-2a247165b8ac/camisa-richelieu-offwhite.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_012", size: "P", color: "Off-white", stock: 2 },
      { id: uid(), product_id: "p_012", size: "M", color: "Off-white", stock: 2 },
      { id: uid(), product_id: "p_012", size: "G", color: "Off-white", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "p_013", store_id: STORE_ID, name: "Conjunto Tricot Marrom", slug: "conjunto-tricot-marrom",
    description: "Conjunto em tricot marrom mesclado: blusa gola alta ampla e calça pantalona com cordão. Perfeito para o inverno.",
    category_id: "conjuntos", brand: "MD Modas", sku: "CJT-TRI-MAR",
    price: 289.9, sale_price: 239.9, stock: 8, weight: 0.8, status: "ativo",
    ...baseProduct,
    meta_title: "Conjunto Tricot Marrom — MD Modas", meta_description: "Conjunto tricot marrom com gola alta e pantalona.",
    images: [mkImg("p_013", "/__l5e/assets-v1/2b657439-aa37-4a2b-9d51-291077492610/conjunto-tricot-marrom.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_013", size: "P", color: "Marrom", stock: 3 },
      { id: uid(), product_id: "p_013", size: "M", color: "Marrom", stock: 3 },
      { id: uid(), product_id: "p_013", size: "G", color: "Marrom", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "p_014", store_id: STORE_ID, name: "Vestido Jeans Bordado Floral", slug: "vestido-jeans-bordado-floral",
    description: "Vestido midi em jeans com bordado floral no busto e barra. Alças finas, cintura marcada com lastex.",
    category_id: "vestidos", brand: "MD Modas", sku: "VST-JNS-FLO",
    price: 229.9, sale_price: 189.9, stock: 6, weight: 0.5, status: "ativo",
    ...baseProduct,
    meta_title: "Vestido Jeans Bordado Floral — MD Modas", meta_description: "Vestido jeans midi com bordado floral.",
    images: [mkImg("p_014", "/__l5e/assets-v1/08264f30-538e-42ed-ab37-74e201842a9c/vestido-jeans-bordado.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_014", size: "P", color: "Jeans", stock: 2 },
      { id: uid(), product_id: "p_014", size: "M", color: "Jeans", stock: 2 },
      { id: uid(), product_id: "p_014", size: "G", color: "Jeans", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "p_015", store_id: STORE_ID, name: "Vestido Longo de Festa", slug: "vestido-longo-festa",
    description: "Vestido longo de festa com renda e tule. Disponível em bordô (alça e manguinha) e rosê com renda guipure.",
    category_id: "vestidos", brand: "MD Modas", sku: "VST-FST-LON",
    price: 599.9, sale_price: 499.9, stock: 5, weight: 0.9, status: "ativo",
    ...baseProduct,
    meta_title: "Vestido Longo de Festa — MD Modas", meta_description: "Vestido longo de festa em renda e tule.",
    images: [mkImg("p_015", "/__l5e/assets-v1/4cf8852b-80f9-4673-99e4-5caaaa78de1a/vestidos-festa-longos.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_015", size: "M", color: "Bordô Alça", stock: 2 },
      { id: uid(), product_id: "p_015", size: "M", color: "Rosê", stock: 1 },
      { id: uid(), product_id: "p_015", size: "G", color: "Bordô Manga", stock: 2 },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p_016", store_id: STORE_ID, name: "Calça Jeans Feminina", slug: "calca-jeans-feminina",
    description: "Calças jeans femininas em três lavagens: clara, grafite com strass e azul média com pérolas. Cintura alta.",
    category_id: "feminino", brand: "MD Modas", sku: "CAL-JNS-FEM",
    price: 189.9, sale_price: 159.9, stock: 12, weight: 0.6, status: "ativo",
    ...baseProduct,
    meta_title: "Calça Jeans Feminina — MD Modas", meta_description: "Calças jeans femininas cintura alta variadas.",
    images: [mkImg("p_016", "/__l5e/assets-v1/e1891fc9-6134-492b-9614-62ea7638cff7/calcas-jeans-trio.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_016", size: "36", color: "Clara", stock: 4 },
      { id: uid(), product_id: "p_016", size: "38", color: "Grafite Strass", stock: 4 },
      { id: uid(), product_id: "p_016", size: "40", color: "Pérolas", stock: 4 },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "p_017", store_id: STORE_ID, name: "Calça Moletom Jogger", slug: "calca-moletom-jogger",
    description: "Calças jogger em moletom com punho e cordão. Disponíveis em preto, cinza Lacoste e azul Nike. Conforto premium.",
    category_id: "masculino", brand: "MD Modas", sku: "CAL-JOG-MAS",
    price: 169.9, sale_price: 139.9, stock: 15, weight: 0.5, status: "ativo",
    ...baseProduct,
    meta_title: "Calça Moletom Jogger — MD Modas", meta_description: "Calças jogger moletom masculinas.",
    images: [mkImg("p_017", "/__l5e/assets-v1/e729b0d5-eb5d-4e57-9654-8da2dcbe6085/calcas-moletom-jogger.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_017", size: "M", color: "Preto", stock: 5 },
      { id: uid(), product_id: "p_017", size: "G", color: "Cinza", stock: 5 },
      { id: uid(), product_id: "p_017", size: "GG", color: "Azul Marinho", stock: 5 },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "p_018", store_id: STORE_ID, name: "Camiseta Básica Masculina", slug: "camiseta-basica-masculina",
    description: "Camisetas básicas masculinas em algodão premium. Disponíveis em cinza mescla, vermelho, marrom e preto com logo bordado.",
    category_id: "masculino", brand: "MD Modas", sku: "CAM-BAS-MAS",
    price: 89.9, sale_price: 69.9, stock: 24, weight: 0.22, status: "ativo",
    ...baseProduct,
    meta_title: "Camiseta Básica Masculina — MD Modas", meta_description: "Camisetas básicas masculinas em várias cores.",
    images: [mkImg("p_018", "/__l5e/assets-v1/1d4d32fb-1433-4f19-8eae-f90d9f83d606/camisetas-masc-basicas.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_018", size: "M", color: "Cinza", stock: 6 },
      { id: uid(), product_id: "p_018", size: "M", color: "Vermelho", stock: 6 },
      { id: uid(), product_id: "p_018", size: "G", color: "Marrom", stock: 6 },
      { id: uid(), product_id: "p_018", size: "G", color: "Preto", stock: 6 },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "p_019", store_id: STORE_ID, name: "Poncho Tricot com Franjas", slug: "poncho-tricot-franjas",
    description: "Poncho em tricot canelado com franjas na barra. Quentinho e elegante. Disponível em cinza e vermelho.",
    category_id: "feminino", brand: "MD Modas", sku: "PON-TRI-FRJ",
    price: 199.9, sale_price: 159.9, stock: 8, weight: 0.6, status: "ativo",
    ...baseProduct,
    meta_title: "Poncho Tricot com Franjas — MD Modas", meta_description: "Poncho tricot com franjas cinza e vermelho.",
    images: [mkImg("p_019", "/__l5e/assets-v1/0519ff79-5be4-4790-ac64-af14fcd01207/poncho-tricot.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_019", size: "Único", color: "Cinza", stock: 4 },
      { id: uid(), product_id: "p_019", size: "Único", color: "Vermelho", stock: 4 },
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "p_020", store_id: STORE_ID, name: "Bermuda Moletom Masculina", slug: "bermuda-moletom-masculina",
    description: "Bermudas masculinas em moletom com bolsos zíper e cordão. Disponíveis em preto, grafite e cinza mescla.",
    category_id: "masculino", brand: "MD Modas", sku: "BER-MOL-MAS",
    price: 109.9, sale_price: 89.9, stock: 14, weight: 0.3, status: "ativo",
    ...baseProduct,
    meta_title: "Bermuda Moletom Masculina — MD Modas", meta_description: "Bermudas masculinas em moletom premium.",
    images: [mkImg("p_020", "/__l5e/assets-v1/283a9b48-6b9a-4359-a626-e63e019e9ec8/bermuda-moletom-masc.jpg", 0, true)],
    variants: [
      { id: uid(), product_id: "p_020", size: "M", color: "Preto", stock: 5 },
      { id: uid(), product_id: "p_020", size: "G", color: "Grafite", stock: 4 },
      { id: uid(), product_id: "p_020", size: "GG", color: "Cinza", stock: 5 },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
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
    { name: "md_products_v6", storage: createJSONStorage(() => localStorage) },
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

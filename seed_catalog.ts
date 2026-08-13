import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Esse script roda no sandbox para inserir os produtos no banco externo snqvhexeruvlyrtzsdnm
const SUPABASE_URL = "https://snqvhexeruvlyrtzsdnm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERRO: EXTERNAL_SUPABASE_SERVICE_ROLE_KEY não definida.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = {
  masculino: "94452af6-2907-4de0-aa74-5c6bf0a1b9a5",
  feminino: "eaf485d8-7d10-447f-8b3b-cf36044b997b",
  plus_size: "010bd70d-4a91-4583-b43b-08fa232b6744"
};

const SIZES_STD = ["P", "M", "G", "GG"];
const SIZES_NUM = ["38", "40", "42", "44", "46", "48"];
const SIZES_PLUS = ["50", "52", "54", "56"];

async function uploadLocalImage(localPath: string, fileName: string) {
  if (!fs.existsSync(localPath)) return null;
  const buffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(`catalog/${Date.now()}-${fileName}`, buffer, {
      contentType: "image/jpeg",
      upsert: true
    });
  
  if (error) {
    console.error(`Erro upload ${fileName}:`, error.message);
    return null;
  }
  return supabase.storage.from("product-images").getPublicUrl(data.path).data.publicUrl;
}

const products = [
  { name: "Calça Jeans Masculina Importada", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_003.jpg" },
  { name: "Calça de Sarja Premium Masculina", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_022.jpg" },
  { name: "Calça Jeans Importada Feminina", price: 129.9, cat: CATEGORIES.feminino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_033.jpg" },
  { name: "Camisa Gola Polo Importada Tommy", price: 99.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/tmp/catalog_images/prod_010.jpg" },
  { name: "Camisa Gola Polo com Elastano", price: 89.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/tmp/catalog_images/prod_025.jpg" },
  { name: "Camiseta Tommy Malha Suprema", price: 89.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/tmp/catalog_images/prod_030.jpg" },
  { name: "Short Sarja Mauricinho", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_015.jpg" },
  { name: "Bermuda Sarja Lacoste", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_028.jpg" },
  { name: "Bermuda Sarja Plus Size", price: 69.9, cat: CATEGORIES.plus_size, sizes: SIZES_PLUS, img: "/tmp/catalog_images/prod_028.jpg" },
  { name: "Bermuda Jeans Masculina", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/tmp/catalog_images/prod_031.jpg" },
  { name: "Camiseta Peruana 40.1", price: 59.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/tmp/catalog_images/prod_012.jpg" },
  { name: "T-Shirt Feminina Algodão", price: 39.9, cat: CATEGORIES.feminino, sizes: SIZES_STD, img: "/tmp/catalog_images/prod_032.jpg" },
];

async function seed() {
  console.log("Iniciando cadastro do catálogo...");
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).slice(2, 5);
    
    const { data: prod, error: pErr } = await supabase.from("products").insert({
      name: p.name,
      slug,
      price: p.price,
      category_id: p.cat,
      brand: "J&S Store",
      stock: p.sizes.length * 10,
      status: "ativo",
      track_stock: true,
      minimum_stock: 2
    }).select("id").single();

    if (pErr) {
      console.error(`Erro ao criar ${p.name}:`, pErr.message);
      continue;
    }

    console.log(`Criado: ${p.name} (${prod.id})`);

    // Variantes
    const variants = p.sizes.map(s => ({
      product_id: prod.id,
      size: s,
      color: "Padrão",
      stock: 10
    }));
    await supabase.from("product_variants").insert(variants);

    // Imagem
    const url = await uploadLocalImage(p.img, `${slug}.jpg`);
    if (url) {
      await supabase.from("product_images").insert({
        product_id: prod.id,
        url,
        position: 0,
        is_primary: true
      });
    }
  }
  console.log("Catálogo cadastrado com sucesso!");
}

seed();

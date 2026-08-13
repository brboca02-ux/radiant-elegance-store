import { createFileRoute } from '@tanstack/react-router'
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute('/api/public/seed-catalog')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get('x-seed-auth');
        if (auth !== 'js-store-catalog-2026') {
          return new Response('Unauthorized', { status: 401 });
        }

        const SUPABASE_URL = "https://snqvhexeruvlyrtzsdnm.supabase.co";
        const supaKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supaKey) {
          return new Response('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY not found', { status: 500 });
        }

        const supabase = createClient(SUPABASE_URL, supaKey);
        
        const CATEGORIES = {
          masculino: "94452af6-2907-4de0-aa74-5c6bf0a1b9a5",
          feminino: "eaf485d8-7d10-447f-8b3b-cf36044b997b",
          plus_size: "010bd70d-4a91-4583-b43b-08fa232b6744"
        };

        const SIZES_STD = ["P", "M", "G", "GG"];
        const SIZES_NUM = ["38", "40", "42", "44", "46", "48"];
        const SIZES_PLUS = ["50", "52", "54", "56"];

        const products = [
          { name: "Calça Jeans Masculina Importada", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/cb3b5a27-09df-4628-9e53-a615abb800e3/prod_003.jpg" },
          { name: "Calça de Sarja Premium Masculina", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/0e689a41-cc7e-4d6e-bfa6-1eb687327189/prod_022.jpg" },
          { name: "Calça Jeans Importada Feminina", price: 129.9, cat: CATEGORIES.feminino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/2fc8f83a-e497-42d1-860a-ce2cdb5d9eca/prod_033.jpg" },
          { name: "Camisa Gola Polo Importada Tommy", price: 99.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/d3810a60-0a52-4bcf-b534-5c88f21b6828/prod_010.jpg" },
          { name: "Camisa Gola Polo com Elastano", price: 89.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/cc7b2f3d-7c18-46d2-9c9c-99dff74aeb4f/prod_005.jpg" },
          { name: "Camiseta Tommy Malha Suprema", price: 89.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/cc7b2f3d-7c18-46d2-9c9c-99dff74aeb4f/prod_005.jpg" },
          { name: "Short Sarja Mauricinho", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/a1e3fb96-cc21-4d69-b51e-0213ca4241bd/prod_015.jpg" },
          { name: "Bermuda Sarja Lacoste", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/26d21519-744b-469c-ac26-eeaecaa26bb5/prod_002.jpg" },
          { name: "Bermuda Sarja Plus Size", price: 69.9, cat: CATEGORIES.plus_size, sizes: SIZES_PLUS, img: "/__l5e/assets-v1/26d21519-744b-469c-ac26-eeaecaa26bb5/prod_002.jpg" },
          { name: "Bermuda Jeans Masculina", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/26d21519-744b-469c-ac26-eeaecaa26bb5/prod_002.jpg" },
          { name: "Camiseta Peruana 40.1", price: 59.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/e57b8bf6-ce04-40b1-9862-6459f21c7fe4/prod_012.jpg" },
          { name: "T-Shirt Feminina Algodão", price: 39.9, cat: CATEGORIES.feminino, sizes: SIZES_STD, img: "/__l5e/assets-v1/2fc8f83a-e497-42d1-860a-ce2cdb5d9eca/prod_033.jpg" },
        ];

        const results = [];
        for (const p of products) {
          const slug = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "-") + "-" + Math.random().toString(36).slice(2, 5);
          
          const { data: prod, error: pErr } = await supabase.from("products").insert({
            name: p.name, slug, price: p.price, category_id: p.cat,
            brand: "J&S Store", stock: p.sizes.length * 10,
            status: "ativo", track_stock: true, minimum_stock: 2
          }).select("id").single();

          if (pErr) {
            results.push({ name: p.name, status: 'error', error: pErr.message });
            continue;
          }

          // Variantes
          const variants = p.sizes.map(s => ({
            product_id: prod.id, size: String(s), color: "Padrão", stock: 10
          }));
          await supabase.from("product_variants").insert(variants);

          // Imagem
          if (p.img) {
            await supabase.from("product_images").insert({
              product_id: prod.id, url: p.img, position: 0, is_primary: true
            });
          }
          
          results.push({ name: p.name, status: 'success', id: prod.id });
        }

        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
})

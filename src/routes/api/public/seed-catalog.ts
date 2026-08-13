import { createFileRoute } from '@tanstack/react-router'
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute('/api/public/seed-catalog')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get('x-seed-auth');
        if (auth !== 'js-store-catalog-2026') return new Response('Unauthorized', { status: 401 });

        // USAR O BANCO DO PROJETO ATUAL
        const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supaUrl = process.env.SUPABASE_URL;

        if (!supaKey || !supaUrl) return new Response('Env keys not found', { status: 500 });

        const supabase = createClient(supaUrl, supaKey);
        
        // Categorias no banco xsahoigznvbsiargjvdu
        // Como o banco está vazio (Lovable Cloud inicial), precisamos criar as categorias ou usar slugs
        const { data: catM } = await supabase.from("categories").insert({ name: "Masculino", slug: "masculino" }).select("id").single();
        const { data: catF } = await supabase.from("categories").insert({ name: "Feminino", slug: "feminino" }).select("id").single();
        const { data: catP } = await supabase.from("categories").insert({ name: "Plus Size", slug: "plus-size" }).select("id").single();

        const CATEGORIES = {
          masculino: catM?.id || "",
          feminino: catF?.id || "",
          plus_size: catP?.id || ""
        };

        const SIZES_STD = ["P", "M", "G", "GG"];
        const SIZES_NUM = ["38", "40", "42", "44", "46", "48"];
        const SIZES_PLUS = ["50", "52", "54", "56"];

        const products = [
          { name: "Calça Jeans Masculina Importada", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/cb3b5a27-09df-4628-9e53-a615abb800e3/prod_003.jpg" },
          { name: "Calça de Sarja Premium Masculina", price: 129.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/0e689a41-cc7e-4d6e-bfa6-1eb687327189/prod_022.jpg" },
          { name: "Calça Jeans Importada Feminina", price: 129.9, cat: CATEGORIES.feminino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/2fc8f83a-e497-42d1-860a-ce2cdb5d9eca/prod_033.jpg" },
          { name: "Camisa Gola Polo Tommy", price: 99.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/d3810a60-0a52-4bcf-b534-5c88f21b6828/prod_010.jpg" },
          { name: "Short Sarja Mauricinho", price: 69.9, cat: CATEGORIES.masculino, sizes: SIZES_NUM, img: "/__l5e/assets-v1/a1e3fb96-cc21-4d69-b51e-0213ca4241bd/prod_015.jpg" },
          { name: "Camiseta Peruana 40.1", price: 59.9, cat: CATEGORIES.masculino, sizes: SIZES_STD, img: "/__l5e/assets-v1/e57b8bf6-ce04-40b1-9862-6459f21c7fe4/prod_012.jpg" },
        ];

        const results = [];
        for (const p of products) {
          if (!p.cat) continue;
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

          const variants = p.sizes.map(s => ({ product_id: prod.id, size: String(s), color: "Padrão", stock: 10 }));
          await supabase.from("product_variants").insert(variants);

          if (p.img) {
            await supabase.from("product_images").insert({ product_id: prod.id, url: p.img, position: 0, is_primary: true });
          }
          results.push({ name: p.name, status: 'success', id: prod.id });
        }

        return new Response(JSON.stringify(results));
      }
    }
  }
})

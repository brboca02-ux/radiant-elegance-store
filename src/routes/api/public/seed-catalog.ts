import { createFileRoute } from '@tanstack/react-router'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

export const Route = createFileRoute('/api/public/seed-catalog')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Proteção simples: exige um header específico
        const auth = request.headers.get('x-seed-auth');
        if (auth !== 'js-store-catalog-2026') {
          return new Response('Unauthorized', { status: 401 });
        }

        const SUPABASE_URL = "https://snqvhexeruvlyrtzsdnm.supabase.co";
        const supaKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

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

        const results = [];
        for (const p of products) {
          const slug = p.name.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).slice(2, 5);
          
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
            product_id: prod.id, size: s, color: "Padrão", stock: 10
          }));
          await supabase.from("product_variants").insert(variants);

          // Nota: Imagens locais não funcionam no serverless worker se o ffmpeg rodou no sandbox.
          // O upload de imagem teria que ser feito via assets ou buffer enviado no request.
          // Por enquanto, cadastramos os produtos sem imagem e o admin as coloca,
          // ou usamos URLs genéricas.
          
          results.push({ name: p.name, status: 'success', id: prod.id });
        }

        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
})

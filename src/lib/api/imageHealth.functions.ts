import { createServerFn } from "@tanstack/react-start";

export type ImageHealth = {
  ok: boolean;
  source: "public" | "admin" | null;
  checkedPath: string | null;
  message: string;
};

/**
 * Diagnóstico da entrega de imagens: pega uma foto real do catálogo e tenta
 * baixá-la pelos dois caminhos (público e autenticado). Usado no painel para
 * que uma falha de credencial apareça no mesmo dia, e não semanas depois.
 */
export const checkImageDelivery = createServerFn({ method: "GET" }).handler(
  async (): Promise<ImageHealth> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error: dbError } = await supabaseAdmin
      .from("product_images")
      .select("url")
      .limit(1);

    if (dbError) {
      return { ok: false, source: null, checkedPath: null, message: `Banco indisponível: ${dbError.message}` };
    }
    const url = rows?.[0]?.url ?? null;
    if (!url) {
      return { ok: true, source: null, checkedPath: null, message: "Nenhuma foto cadastrada para verificar." };
    }

    const path = url.replace(/^\/api\/public\/img\//, "").split("?")[0]!;
    const base = process.env["SUPABASE_URL"];

    if (base) {
      try {
        const r = await fetch(`${base}/storage/v1/object/public/product-images/${path}`);
        if (r.ok) return { ok: true, source: "public", checkedPath: path, message: "Fotos OK (caminho público)." };
      } catch {
        // segue para o fallback
      }
    }

    const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
    if (data) return { ok: true, source: "admin", checkedPath: path, message: "Fotos OK (caminho autenticado)." };

    return {
      ok: false,
      source: null,
      checkedPath: path,
      message: `Problema na entrega de imagens: ${error?.message ?? "erro desconhecido"}`,
    };
  },
);

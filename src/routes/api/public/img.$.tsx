import { createFileRoute } from "@tanstack/react-router";

/**
 * Serve imagens de produto do bucket `product-images` do Lovable Cloud.
 *
 * Robustez proposital (as fotos da loja NUNCA devem depender de um único caminho):
 *  1) tenta o caminho público do Storage (não exige credencial);
 *  2) se falhar, baixa via cliente admin (service role);
 *  3) só devolve 404 quando o arquivo realmente não existe; qualquer outra
 *     falha vira 502 + log no servidor, para o problema não ficar invisível.
 */

function sanitize(raw: string): string | null {
  const path = raw.split("?")[0]!.replace(/\.\./g, "").replace(/^\/+/, "");
  if (!path || !/^[A-Za-z0-9._\-/]+$/.test(path)) return null;
  return path;
}

const CACHE = "public, max-age=31536000, immutable";

async function tryPublicUrl(path: string): Promise<Response | null> {
  const base = process.env["SUPABASE_URL"];
  if (!base) return null;
  try {
    const r = await fetch(`${base}/storage/v1/object/public/product-images/${path}`);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength === 0) return null;
    return new Response(buf, {
      headers: {
        "content-type": r.headers.get("content-type") || "image/webp",
        "cache-control": CACHE,
        "x-img-source": "public",
      },
    });
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = sanitize((params as { _splat?: string })._splat ?? "");
        if (!path) return new Response("Not found", { status: 404 });

        // 1) caminho público (bucket público ou política anon de leitura)
        const pub = await tryPublicUrl(path);
        if (pub) return pub;

        // 2) fallback autenticado (service role)
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);

          if (data) {
            return new Response(await data.arrayBuffer(), {
              headers: {
                "content-type": data.type || "image/webp",
                "cache-control": CACHE,
                "x-img-source": "admin",
              },
            });
          }

          const message = error?.message ?? "unknown storage error";
          const notFound = /not found|does not exist|no such/i.test(message);
          if (notFound) {
            console.warn(`[img] arquivo inexistente: ${path}`);
            return new Response("Not found", { status: 404 });
          }
          // Falha de credencial/serviço: NÃO mascarar como 404.
          console.error(`[img] falha ao entregar ${path}: ${message}`);
          return new Response(`Image delivery failed: ${message}`, {
            status: 502,
            headers: { "cache-control": "no-store" },
          });
        } catch (e) {
          const message = (e as Error).message ?? "unexpected error";
          console.error(`[img] erro inesperado em ${path}: ${message}`);
          return new Response(`Image delivery failed: ${message}`, {
            status: 502,
            headers: { "cache-control": "no-store" },
          });
        }
      },
    },
  },
});

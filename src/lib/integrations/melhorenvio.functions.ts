import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Cotação de frete via Melhor Envio.
 * Requer os segredos (lidos dentro do handler):
 *  - MELHORENVIO_TOKEN     → token Bearer da API
 *  - MELHORENVIO_ENV       → "sandbox" | "production" (default: production)
 *  - MELHORENVIO_FROM_CEP  → CEP de origem (default: 89235188 — Joinville/SC)
 */

const inputSchema = z.object({
  toCep: z.string().regex(/^\d{8}$/),
  itemsCount: z.number().int().min(1).max(100),
  insuranceValue: z.number().min(0).max(100000),
});

export interface MelhorEnvioQuote {
  code: string;
  name: string;
  price: number;
  days: number;
  carrier?: string;
}

const API = {
  production: "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
  sandbox: "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
};

export const quoteMelhorEnvio = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ quotes: MelhorEnvioQuote[]; error?: string }> => {
    const token = process.env["MELHORENVIO_TOKEN"];
    if (!token) return { quotes: [], error: "not_configured" };

    const env = process.env["MELHORENVIO_ENV"] === "sandbox" ? "sandbox" : "production";
    const fromCep = (process.env["MELHORENVIO_FROM_CEP"] ?? "89235188").replace(/\D/g, "");

    // Pacote padrão de vestuário: 0,4 kg e 30x25x5 cm por peça.
    const qty = data.itemsCount;
    const body = {
      from: { postal_code: fromCep },
      to: { postal_code: data.toCep },
      package: {
        height: 5 + Math.max(0, qty - 1) * 2,
        width: 25,
        length: 30,
        weight: +(0.4 * qty).toFixed(2),
      },
      options: {
        insurance_value: +data.insuranceValue.toFixed(2),
        receipt: false,
        own_hand: false,
      },
    };

    try {
      const res = await fetch(API[env], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "J&S Store (contato@jsstore.com.br)",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("[melhorenvio] HTTP", res.status, (await res.text()).slice(0, 400));
        return { quotes: [], error: "upstream_error" };
      }

      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const quotes: MelhorEnvioQuote[] = (Array.isArray(raw) ? raw : [])
        .filter((s) => !s["error"] && s["price"])
        .map((s) => {
          const company = s["company"] as { name?: string } | undefined;
          const price = Number(s["custom_price"] ?? s["price"] ?? 0);
          const days = Number(s["custom_delivery_time"] ?? s["delivery_time"] ?? 5);
          return {
            code: `me-${String(s["id"] ?? s["name"])}`,
            name: `${company?.name ?? "Melhor Envio"} · ${String(s["name"] ?? "")}`.trim(),
            price: +price.toFixed(2),
            days: Number.isFinite(days) ? days : 5,
            carrier: company?.name,
          };
        })
        .filter((q) => q.price > 0)
        .sort((a, b) => a.price - b.price);

      return { quotes };
    } catch (e) {
      console.error("[melhorenvio] falha na cotação:", e);
      return { quotes: [], error: "network_error" };
    }
  });

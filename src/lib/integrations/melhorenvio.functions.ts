import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calculateConsolidatedPackage } from "./packaging";

const itemSchema = z.object({
  quantity: z.number().int().min(1),
  category: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  weight: z.number().nullable().optional(),
  height_cm: z.number().nullable().optional(),
  width_cm: z.number().nullable().optional(),
  length_cm: z.number().nullable().optional(),
});

const inputSchema = z.object({
  toCep: z.string().regex(/^\d{8}$/),
  insuranceValue: z.number().min(0).max(100000),
  itemsCount: z.number().int().min(1).max(100).optional(),
  items: z.array(itemSchema).optional(),
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

    // Prepara os itens recebidos para o cálculo automático determinístico
    const rawItems = data.items && data.items.length > 0
      ? data.items
      : Array.from({ length: data.itemsCount ?? 1 }).map(() => ({ quantity: 1 }));

    // Cálculo dinâmico das dimensões e peso
    const pkg = calculateConsolidatedPackage(rawItems);

    const body = {
      from: { postal_code: fromCep },
      to: { postal_code: data.toCep },
      package: {
        height: pkg.height,
        width: pkg.width,
        length: pkg.length,
        weight: pkg.weight,
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
<<<<<<< HEAD
import { createServerFn } from "@tanstack/start";

export interface UberQuoteInput {
  cep: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  subtotal?: number;
}

export interface UberQuoteResponse {
  fee?: number; // valor em R$
=======
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Cotação de entrega expressa via Uber Direct.
 * Segredos lidos DENTRO do handler (env liga por requisição no Worker):
 *  - UBER_CLIENT_ID
 *  - UBER_CLIENT_SECRET
 *  - UBER_CUSTOMER_ID
 *  - UBER_PICKUP_ADDRESS  → endereço completo da loja (rua, nº, bairro, Joinville/SC, CEP)
 */

const inputSchema = z.object({
  cep: z.string().min(8).max(9),
  street: z.string().optional(),
  number: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  subtotal: z.number().min(0).max(1000000),
});

export interface UberQuoteResponse {
  fee: number; // em R$
>>>>>>> 9080b192ac2f9e0b728b2d0d0488881f716a9ca9
  estimatedMinutes?: number;
  quoteId?: string;
  error?: string;
}

<<<<<<< HEAD
export const quoteUberDirect = createServerFn({ method: "POST" })
  .validator((data: UberQuoteInput) => data)
  .handler(async ({ data }): Promise<UberQuoteResponse> => {
    const customerId = process.env.UBER_CUSTOMER_ID;
    const clientId = process.env.UBER_CLIENT_ID;
    const clientSecret = process.env.UBER_CLIENT_SECRET;
    const pickupAddressRaw = process.env.UBER_PICKUP_ADDRESS;

    if (!customerId || !clientId || !clientSecret || !pickupAddressRaw) {
      return { error: "Credenciais da Uber Direct não configuradas no servidor." };
    }

    try {
      // 1. Obter token OAuth 2.0
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "eats.deliveries",
      });

      const tokenRes = await fetch("https://auth.uber.com/oauth/v2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Uber Direct] Falha na autenticação:", errBody);
        return { error: "Falha na autenticação com Uber Direct." };
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Montar endereço de entrega (dropoff)
      const dropoffAddress = [
        data.street,
        data.number,
        data.district,
        data.city || "Joinville",
        data.state || "SC",
        data.cep,
      ]
        .filter(Boolean)
        .join(", ");

      // 3. Solicitar cotação
      const quoteRes = await fetch(
        `https://api.uber.com/v1/customers/${customerId}/delivery_quotes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickup_address: pickupAddressRaw,
            dropoff_address: dropoffAddress,
          }),
        }
      );

      if (!quoteRes.ok) {
        const quoteErr = await quoteRes.text();
        console.error("[Uber Direct] Erro na cotação:", quoteErr);
        return { error: "Não foi possível cotar a entrega expressa via Uber." };
      }

      const quoteData = await quoteRes.json();

      // Converte taxa de centavos para reais (ex: 1550 -> 15.50)
      const feeInReais = typeof quoteData.fee === "number" ? quoteData.fee / 100 : undefined;
      const estimatedMinutes = typeof quoteData.duration === "number" ? Math.round(quoteData.duration / 60) : undefined;

      return {
        fee: feeInReais,
        estimatedMinutes,
        quoteId: quoteData.id,
      };
    } catch (err: any) {
      console.error("[Uber Direct] Exceção capturada:", err);
      return { error: err?.message || "Erro inesperado na cotação Uber Direct." };
    }
  });
=======
async function getUberToken(clientId: string, clientSecret: string): Promise<string | null> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }).toString(),
  });
  if (!res.ok) {
    console.error("[uber] token HTTP", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export const quoteUberDirect = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<UberQuoteResponse> => {
    const clientId = process.env["UBER_CLIENT_ID"];
    const clientSecret = process.env["UBER_CLIENT_SECRET"];
    const customerId = process.env["UBER_CUSTOMER_ID"];
    const pickupAddress = process.env["UBER_PICKUP_ADDRESS"];

    if (!clientId || !clientSecret || !customerId || !pickupAddress) {
      return { fee: 0, error: "not_configured" };
    }

    const cep = data.cep.replace(/\D/g, "");
    const dropoff = [
      [data.street, data.number].filter(Boolean).join(", "),
      data.district,
      `${data.city ?? "Joinville"}/${data.state ?? "SC"}`,
      cep,
    ]
      .filter(Boolean)
      .join(" - ");

    try {
      const token = await getUberToken(clientId, clientSecret);
      if (!token) return { fee: 0, error: "auth_error" };

      const res = await fetch(
        `https://api.uber.com/v1/customers/${encodeURIComponent(customerId)}/delivery_quotes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup_address: pickupAddress,
            dropoff_address: dropoff,
            manifest_total_value: Math.round(data.subtotal * 100),
            external_store_id: "js-store-joinville",
          }),
        },
      );

      if (!res.ok) {
        console.error("[uber] quote HTTP", res.status, (await res.text()).slice(0, 400));
        return { fee: 0, error: "upstream_error" };
      }

      const json = (await res.json()) as {
        fee?: number;
        id?: string;
        duration?: number;
        dropoff_eta?: number;
      };

      const cents = Number(json.fee ?? 0);
      if (!Number.isFinite(cents) || cents <= 0) return { fee: 0, error: "no_quote" };

      return {
        fee: +(cents / 100).toFixed(2),
        estimatedMinutes: json.dropoff_eta ?? json.duration,
        quoteId: json.id,
      };
    } catch (e) {
      console.error("[uber] falha na cotação:", e);
      return { fee: 0, error: "network_error" };
    }
  });
>>>>>>> 9080b192ac2f9e0b728b2d0d0488881f716a9ca9

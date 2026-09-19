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
  estimatedMinutes?: number;
  quoteId?: string;
  error?: string;
}

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
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
<<<<<<< HEAD
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
=======
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Integração Melhor Envio (API v2 oficial).
 * Segredos lidos SEMPRE dentro do handler (nunca chegam ao navegador):
 *  - MELHORENVIO_TOKEN        → token Bearer
 *  - MELHORENVIO_ENV          → "sandbox" | "production" (default: production)
 *  - MELHORENVIO_FROM_CEP     → CEP de origem (default 89235188 — Joinville/SC)
 *  - MELHORENVIO_FROM_*       → dados do remetente (necessários só para comprar etiqueta)
 *  - MELHORENVIO_SUPPORT_EMAIL→ e-mail do User-Agent obrigatório
 */
>>>>>>> 9080b192ac2f9e0b728b2d0d0488881f716a9ca9

const SUPPORT_EMAIL = () =>
  process.env["MELHORENVIO_SUPPORT_EMAIL"] ?? "contato@jesstorejoinville.com.br";

const BASE = () =>
  process.env["MELHORENVIO_ENV"] === "sandbox"
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";

function fromCep(): string {
  return (process.env["MELHORENVIO_FROM_CEP"] ?? "89235188").replace(/\D/g, "");
}

class MEError extends Error {}

async function me<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const token = process.env["MELHORENVIO_TOKEN"];
  if (!token) throw new MEError("Melhor Envio não configurado (token ausente).");

  const res = await fetch(`${BASE()}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `J&S Store (${SUPPORT_EMAIL()})`,
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[melhorenvio]", init.method, path, res.status, text.slice(0, 600));
    throw new MEError(`Melhor Envio respondeu ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new MEError("Resposta inválida do Melhor Envio.");
  }
}

// ---------------------------------------------------------------- dimensões
/** Mínimos aceitos pelo Melhor Envio (cm/kg). */
const MIN_DIM = { height: 2, width: 11, length: 16 };

type ProductRow = {
  id: string;
  name: string;
  price: number;
  weight: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
};

interface MEProduct {
  id: string;
  name: string;
  quantity: number;
  unitary_value: number;
  weight: number;
  height: number;
  width: number;
  length: number;
}

function toMEProducts(
  rows: ProductRow[],
  qtyById: Map<string, number>,
): { products: MEProduct[]; missing: string[] } {
  const missing: string[] = [];
  const products = rows.map((p) => {
    const weight = Number(p.weight);
    if (!(Number(p.weight) > 0)) missing.push(`${p.name}: peso`);
    if (!p.height_cm || !p.width_cm || !p.length_cm) missing.push(`${p.name}: dimensões`);
    return {
      id: p.id,
      name: p.name.slice(0, 120),
      quantity: qtyById.get(p.id) ?? 1,
      unitary_value: +Number(p.price ?? 0).toFixed(2),
      weight: +weight.toFixed(3),
      height: Number(p.height_cm),
      width: Number(p.width_cm),
      length: Number(p.length_cm),
    };
  });
  return { products, missing };
}

async function loadProducts(ids: string[]): Promise<ProductRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("products")
    .select("id,name,price,weight,height_cm,width_cm,length_cm")
    .in("id", ids);
  return (data ?? []) as unknown as ProductRow[];
}

// ------------------------------------------------------------------ cotação
const quoteSchema = z.object({
  toCep: z.string().regex(/^\d{8}$/),
  insuranceValue: z.number().min(0).max(100000),
<<<<<<< HEAD
  itemsCount: z.number().int().min(1).max(100).optional(),
  items: z.array(itemSchema).optional(),
=======
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
    .max(50)
    .optional(),
>>>>>>> 9080b192ac2f9e0b728b2d0d0488881f716a9ca9
});

export interface MelhorEnvioQuote {
  code: string;
  serviceId: number;
  name: string;
  price: number;
  days: number;
  carrier?: string;
}

export const quoteMelhorEnvio = createServerFn({ method: "POST" })
  .inputValidator((input) => quoteSchema.parse(input))
  .handler(async ({ data }): Promise<{ quotes: MelhorEnvioQuote[]; error?: string }> => {
    if (!process.env["MELHORENVIO_TOKEN"]) return { quotes: [], error: "not_configured" };

    let body: Record<string, unknown>;

<<<<<<< HEAD
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
=======
    // Preferimos os produtos reais do pedido (peso/dimensões/valor do banco).
    const items = data.items?.filter((i) => i.product_id) ?? [];
    let meProducts: MEProduct[] = [];
    if (items.length) {
      const qtyById = new Map<string, number>();
      for (const i of items) qtyById.set(i.product_id, (qtyById.get(i.product_id) ?? 0) + i.quantity);
      const rows = await loadProducts([...qtyById.keys()]);
       const converted = toMEProducts(rows, qtyById);
       if (converted.missing.length) {
         return { quotes: [], error: `Dados de embalagem ausentes: ${[...new Set(converted.missing)].join(", ")}` };
       }
       meProducts = converted.products;
    }

    if (meProducts.length) {
      body = {
        from: { postal_code: fromCep() },
        to: { postal_code: data.toCep },
        products: meProducts,
        options: { insurance_value: +data.insuranceValue.toFixed(2), receipt: false, own_hand: false },
      };
    } else {
      return { quotes: [], error: "Produtos sem identificação válida para calcular peso e dimensões." };
    }
>>>>>>> 9080b192ac2f9e0b728b2d0d0488881f716a9ca9

    try {
      const raw = await me<Array<Record<string, unknown>>>("/api/v2/me/shipment/calculate", {
        method: "POST",
        body,
      });

      const quotes: MelhorEnvioQuote[] = (Array.isArray(raw) ? raw : [])
        .filter((s) => !s["error"] && s["price"])
        .map((s) => {
          const company = s["company"] as { name?: string } | undefined;
          const price = Number(s["custom_price"] ?? s["price"] ?? 0);
          const days = Number(s["custom_delivery_time"] ?? s["delivery_time"] ?? 5);
          const serviceId = Number(s["id"] ?? 0);
          return {
            code: `me-${serviceId || String(s["name"])}`,
            serviceId,
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
      return { quotes: [], error: e instanceof MEError ? "upstream_error" : "network_error" };
    }
  });

// ------------------------------------------------------- helpers de admin
async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_price: number | null;
  melhor_envio_order_id: string | null;
  tracking_code: string | null;
  shipping_service_id: number | null;
  shipping_service_name: string | null;
  shipping_status: string | null;
  label_url: string | null;
  label_generated_at: string | null;
  tracking_updated_at: string | null;
  customers: { name: string; email: string; phone: string | null; cpf: string | null } | null;
  addresses: {
    cep: string; street: string; number: string; complement: string | null;
    district: string; city: string; state: string;
  } | null;
  order_items: { product_id: string | null; quantity: number }[];
};

async function loadOrder(orderId: string): Promise<OrderRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,order_number,status,subtotal,shipping_price,melhor_envio_order_id,tracking_code,shipping_service_id,shipping_service_name,shipping_status,label_url,label_generated_at,tracking_updated_at,customers(name,email,phone,cpf),addresses(cep,street,number,complement,district,city,state),order_items(product_id,quantity)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) throw new MEError("Pedido não encontrado.");
  return data as unknown as OrderRow;
}

async function patchOrder(orderId: string, patch: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("orders")
    .update(patch as never)
    .eq("id", orderId);
  if (error) throw new MEError(`Falha ao salvar no pedido: ${error.message}`);
}

function senderOrMissing(): { from?: Record<string, unknown>; missing: string[] } {
  const e = process.env;
  const need = {
    MELHORENVIO_FROM_NAME: e["MELHORENVIO_FROM_NAME"],
    MELHORENVIO_FROM_PHONE: e["MELHORENVIO_FROM_PHONE"],
    MELHORENVIO_FROM_EMAIL: e["MELHORENVIO_FROM_EMAIL"],
    MELHORENVIO_FROM_DOCUMENT: e["MELHORENVIO_FROM_DOCUMENT"],
    MELHORENVIO_FROM_ADDRESS: e["MELHORENVIO_FROM_ADDRESS"],
    MELHORENVIO_FROM_NUMBER: e["MELHORENVIO_FROM_NUMBER"],
    MELHORENVIO_FROM_DISTRICT: e["MELHORENVIO_FROM_DISTRICT"],
    MELHORENVIO_FROM_CITY: e["MELHORENVIO_FROM_CITY"],
    MELHORENVIO_FROM_STATE: e["MELHORENVIO_FROM_STATE"],
  };
  const missing = Object.entries(need).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { missing };
  return {
    missing: [],
    from: {
      name: need.MELHORENVIO_FROM_NAME,
      phone: (need.MELHORENVIO_FROM_PHONE ?? "").replace(/\D/g, ""),
      email: need.MELHORENVIO_FROM_EMAIL,
      document: (need.MELHORENVIO_FROM_DOCUMENT ?? "").replace(/\D/g, ""),
      address: need.MELHORENVIO_FROM_ADDRESS,
      complement: e["MELHORENVIO_FROM_COMPLEMENT"] ?? "",
      number: need.MELHORENVIO_FROM_NUMBER,
      district: need.MELHORENVIO_FROM_DISTRICT,
      city: need.MELHORENVIO_FROM_CITY,
      state_abbr: need.MELHORENVIO_FROM_STATE,
      country_id: "BR",
      postal_code: fromCep(),
    },
  };
}

export interface ShipmentState {
  ok: boolean;
  message?: string;
  missingData?: string[];
  melhorEnvioOrderId?: string | null;
  trackingCode?: string | null;
  serviceId?: number | null;
  serviceName?: string | null;
  shippingPrice?: number | null;
  shippingStatus?: string | null;
  labelUrl?: string | null;
  labelGeneratedAt?: string | null;
  trackingUpdatedAt?: string | null;
}

function toState(o: OrderRow, extra?: Partial<ShipmentState>): ShipmentState {
  return {
    ok: true,
    melhorEnvioOrderId: o.melhor_envio_order_id,
    trackingCode: o.tracking_code,
    serviceId: o.shipping_service_id,
    serviceName: o.shipping_service_name,
    shippingPrice: o.shipping_price,
    shippingStatus: o.shipping_status,
    labelUrl: o.label_url,
    labelGeneratedAt: o.label_generated_at,
    trackingUpdatedAt: o.tracking_updated_at,
    ...extra,
  };
}

// ------------------------------------------------- estado atual no painel
export const getShipmentState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<ShipmentState> => {
    await assertAdmin(context);
    try {
      return toState(await loadOrder(data.orderId));
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Erro" };
    }
  });

// --------------------------------------- cotação para o painel (admin)
export const quoteOrderShipping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(
    async ({ data, context }): Promise<{ quotes: MelhorEnvioQuote[]; error?: string; missingData?: string[] }> => {
      await assertAdmin(context);
      try {
        const order = await loadOrder(data.orderId);
        if (!order.addresses?.cep) return { quotes: [], error: "Pedido sem endereço de entrega." };

        const qtyById = new Map<string, number>();
        for (const i of order.order_items ?? []) {
          if (i.product_id) qtyById.set(i.product_id, (qtyById.get(i.product_id) ?? 0) + i.quantity);
        }
        const rows = await loadProducts([...qtyById.keys()]);
        const { products, missing } = toMEProducts(rows, qtyById);
        if (missing.length) {
          return {
            quotes: [],
            error: "Cadastre peso e dimensões de embalagem antes de cotar.",
            missingData: [...new Set(missing)],
          };
        }

        const raw = await me<Array<Record<string, unknown>>>("/api/v2/me/shipment/calculate", {
          method: "POST",
          body: {
            from: { postal_code: fromCep() },
            to: { postal_code: order.addresses.cep.replace(/\D/g, "") },
            products,
            options: { insurance_value: +Number(order.subtotal).toFixed(2), receipt: false, own_hand: false },
          },
        });

        const quotes = (Array.isArray(raw) ? raw : [])
          .filter((s) => !s["error"] && s["price"])
          .map((s) => {
            const company = s["company"] as { name?: string } | undefined;
            const serviceId = Number(s["id"] ?? 0);
            return {
              code: `me-${serviceId}`,
              serviceId,
              name: `${company?.name ?? "Melhor Envio"} · ${String(s["name"] ?? "")}`.trim(),
              price: +Number(s["custom_price"] ?? s["price"] ?? 0).toFixed(2),
              days: Number(s["custom_delivery_time"] ?? s["delivery_time"] ?? 5),
              carrier: company?.name,
            };
          })
          .filter((q) => q.price > 0 && q.serviceId > 0)
          .sort((a, b) => a.price - b.price);

        return { quotes, missingData: [...new Set(missing)] };
      } catch (e) {
        return { quotes: [], error: e instanceof Error ? e.message : "Erro na cotação." };
      }
    },
  );

// --------------------------- comprar frete (carrinho + checkout pago)
export const buyShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ orderId: z.string().uuid(), serviceId: z.number().int().positive() }).parse(i),
  )
  .handler(async ({ data, context }): Promise<ShipmentState> => {
    await assertAdmin(context);
    try {
      const order = await loadOrder(data.orderId);
      if (order.status !== "pago") return { ok: false, message: "Confirme o pagamento do pedido antes de comprar o frete." };
      if (order.melhor_envio_order_id) return toState(order, { message: "Este pedido já tem envio no Melhor Envio." });
      if (!order.addresses) return { ok: false, message: "Pedido sem endereço de entrega." };
      if (!order.customers?.cpf) return { ok: false, message: "Falta o CPF do cliente — o Melhor Envio exige documento do destinatário.", missingData: ["CPF do cliente"] };

      const sender = senderOrMissing();
      if (!sender.from) {
        return {
          ok: false,
          message: "Faltam os dados do remetente da loja para emitir a etiqueta.",
          missingData: sender.missing,
        };
      }

      const qtyById = new Map<string, number>();
      for (const i of order.order_items ?? []) {
        if (i.product_id) qtyById.set(i.product_id, (qtyById.get(i.product_id) ?? 0) + i.quantity);
      }
      const rows = await loadProducts([...qtyById.keys()]);
       const { products, missing } = toMEProducts(rows, qtyById);
       if (missing.length) {
         return {
           ok: false,
           message: "Cadastre peso e dimensões de embalagem antes de comprar o frete.",
           missingData: [...new Set(missing)],
         };
       }
      if (!products.length) return { ok: false, message: "Nenhum produto válido no pedido para gerar o envio." };

      const totalWeight = products.reduce((s, p) => s + p.weight * p.quantity, 0);
      const insurance = products.reduce((s, p) => s + p.unitary_value * p.quantity, 0);
      const a = order.addresses;

      const cart = await me<{ id: string; protocol?: string; status?: string }>("/api/v2/me/cart", {
        method: "POST",
        body: {
          service: data.serviceId,
          from: sender.from,
          to: {
            name: order.customers?.name ?? "Cliente",
            phone: (order.customers?.phone ?? "").replace(/\D/g, ""),
            email: order.customers?.email ?? "",
            document: order.customers.cpf.replace(/\D/g, ""),
            address: a.street,
            complement: a.complement ?? "",
            number: a.number,
            district: a.district,
            city: a.city,
            state_abbr: a.state,
            country_id: "BR",
            postal_code: a.cep.replace(/\D/g, ""),
          },
          products: products.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unitary_value: p.unitary_value,
          })),
          volumes: [
            {
              height: Math.max(MIN_DIM.height, Math.max(...products.map((p) => p.height))),
              width: Math.max(MIN_DIM.width, Math.max(...products.map((p) => p.width))),
              length: Math.max(MIN_DIM.length, Math.max(...products.map((p) => p.length))),
              weight: +totalWeight.toFixed(3),
            },
          ],
          options: {
            insurance_value: +insurance.toFixed(2),
            receipt: false,
            own_hand: false,
            reverse: false,
            non_commercial: true,
            invoice: { key: "" },
          },
        },
      });

      // Compra (debita da carteira Melhor Envio)
      const checkout = await me<{ purchase?: { id?: string; status?: string } }>(
        "/api/v2/me/shipment/checkout",
        { method: "POST", body: { orders: [cart.id] } },
      );

      const info = await me<Record<string, unknown>>(`/api/v2/me/orders/${cart.id}`, { method: "GET" });
      const price = Number(info["price"] ?? 0) || null;
      const serviceName =
        ((info["service"] as { name?: string } | undefined)?.name ??
          order.shipping_service_name ??
          null) as string | null;

      const patch = {
        melhor_envio_order_id: cart.id,
        melhor_envio_shipment_id: checkout.purchase?.id ?? cart.id,
        shipping_service_id: data.serviceId,
        shipping_service_name: serviceName,
        shipping_price: price,
        shipping_status: String(info["status"] ?? checkout.purchase?.status ?? "paid"),
        tracking_code: (info["tracking"] as string | null) ?? null,
      };
      await patchOrder(order.id, patch);

      return toState(order, {
        message: "Frete comprado no Melhor Envio. Agora gere a etiqueta.",
        melhorEnvioOrderId: cart.id,
        shippingPrice: price,
        serviceId: data.serviceId,
        serviceName,
        shippingStatus: patch.shipping_status,
        trackingCode: patch.tracking_code,
      });
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Falha ao comprar o frete." };
    }
  });

// --------------------------------------- gerar + imprimir etiqueta
export const generateLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<ShipmentState> => {
    await assertAdmin(context);
    try {
      const order = await loadOrder(data.orderId);
      const meId = order.melhor_envio_order_id;
      if (!meId) return { ok: false, message: "Compre o frete no Melhor Envio antes de gerar a etiqueta." };

      await me("/api/v2/me/shipment/generate", { method: "POST", body: { orders: [meId] } });

      // A geração é assíncrona: aguarda o status sair de "paid".
      let status = "";
      let tracking: string | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((r) => setTimeout(r, 1500));
        const info = await me<Record<string, unknown>>(`/api/v2/me/orders/${meId}`, { method: "GET" });
        status = String(info["status"] ?? "");
        tracking = (info["tracking"] as string | null) ?? tracking;
        if (status === "generated" || status === "released" || status === "posted" || tracking) break;
      }

      const printed = await me<{ url?: string }>("/api/v2/me/shipment/print", {
        method: "POST",
        body: { mode: "private", orders: [meId] },
      });
      if (!printed.url) return { ok: false, message: "A etiqueta ainda está sendo processada. Tente novamente em instantes." };

      const now = new Date().toISOString();
      await patchOrder(order.id, {
        label_url: printed.url,
        label_generated_at: now,
        shipping_status: status || "generated",
        ...(tracking ? { tracking_code: tracking, tracking_updated_at: now } : {}),
      });

      return toState(order, {
        message: "Etiqueta gerada.",
        labelUrl: printed.url,
        labelGeneratedAt: now,
        shippingStatus: status || "generated",
        trackingCode: tracking ?? order.tracking_code,
      });
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Falha ao gerar a etiqueta." };
    }
  });

// ----------------------------------------------------- rastreamento
export const refreshTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<ShipmentState> => {
    await assertAdmin(context);
    try {
      const order = await loadOrder(data.orderId);
      const meId = order.melhor_envio_order_id;
      if (!meId) return { ok: false, message: "Este pedido ainda não tem envio no Melhor Envio." };

      const raw = await me<Record<string, Record<string, unknown>>>("/api/v2/me/shipment/tracking", {
        method: "POST",
        body: { orders: [meId] },
      });
      const entry = raw[meId] ?? Object.values(raw)[0] ?? {};
      const tracking = (entry["tracking"] as string | null) ?? order.tracking_code;
      const status = String(entry["status"] ?? order.shipping_status ?? "");
      const now = new Date().toISOString();

      await patchOrder(order.id, {
        ...(tracking ? { tracking_code: tracking } : {}),
        shipping_status: status || null,
        tracking_updated_at: now,
      });

      // Status de entrega reflete no fulfillment que o cliente vê.
      if (status === "delivered") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("orders").update({ fulfillment_status: "entregue" } as never).eq("id", order.id);
      } else if (status === "posted" || status === "in_transit") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("orders").update({ fulfillment_status: "em_transito" } as never).eq("id", order.id);
      }

      return toState(order, {
        message: "Rastreio atualizado.",
        trackingCode: tracking,
        shippingStatus: status || null,
        trackingUpdatedAt: now,
      });
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Falha ao consultar o rastreio." };
    }
  });

// -------------------------------------------------------- cancelamento
export const cancelShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().max(200).optional() }).parse(i),
  )
  .handler(async ({ data, context }): Promise<ShipmentState> => {
    await assertAdmin(context);
    try {
      const order = await loadOrder(data.orderId);
      const meId = order.melhor_envio_order_id;
      if (!meId) return { ok: false, message: "Não há envio para cancelar." };

      await me("/api/v2/me/shipment/cancel", {
        method: "POST",
        body: {
          order: {
            id: meId,
            reason_id: "2",
            description: data.reason ?? "Pedido cancelado pela loja J&S Store.",
          },
        },
      });

      await patchOrder(order.id, {
        shipping_status: "canceled",
        label_url: null,
        label_generated_at: null,
      });

      return toState(order, {
        message: "Envio cancelado no Melhor Envio.",
        shippingStatus: "canceled",
        labelUrl: null,
        labelGeneratedAt: null,
      });
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "O Melhor Envio não permitiu o cancelamento." };
    }
  });
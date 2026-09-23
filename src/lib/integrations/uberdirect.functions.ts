import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UBER_API = "https://api.uber.com/v1";
const UBER_AUTH = "https://auth.uber.com/oauth/v2/token";

const quoteSchema = z.object({
  cep: z.string().min(8).max(9),
  street: z.string().min(2).max(120),
  number: z.string().min(1).max(20),
  district: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  state: z.string().length(2),
  subtotal: z.number().min(0).max(1_000_000),
});

const orderSchema = z.object({ orderId: z.string().uuid() });

export interface UberQuoteResponse {
  fee: number;
  estimatedMinutes?: number;
  quoteId?: string;
  expiresAt?: string;
  dropoffEta?: string;
  error?: string;
  message?: string;
}

export interface UberDeliveryState {
  ok: boolean;
  message?: string;
  missingData?: string[];
  quoteId?: string | null;
  quoteExpiresAt?: string | null;
  deliveryId?: string | null;
  fee?: number | null;
  status?: string | null;
  trackingUrl?: string | null;
  pickupEta?: string | null;
  dropoffEta?: string | null;
  updatedAt?: string | null;
  failureReason?: string | null;
}

class UberError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

let tokenCache: { token: string; expiresAt: number } | null = null;

function credentials() {
  return {
    clientId: process.env["UBER_CLIENT_ID"],
    clientSecret: process.env["UBER_CLIENT_SECRET"],
    customerId: process.env["UBER_CUSTOMER_ID"],
  };
}

function pickupConfig() {
  const address = process.env["UBER_PICKUP_ADDRESS"];
  const name = process.env["UBER_PICKUP_NAME"];
  const phone = process.env["UBER_PICKUP_PHONE"];
  const instructions = process.env["UBER_PICKUP_INSTRUCTIONS"] ?? "Retirada na J&S Store";
  const missing = [
    !address && "endereço de retirada",
    !name && "nome do remetente",
    !phone && "telefone do remetente",
  ].filter((value): value is string => Boolean(value));
  return { address, name, phone, instructions, missing };
}

function safeProviderMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const body = value as Record<string, unknown>;
  const raw = body["message"] ?? body["error"] ?? body["detail"];
  return typeof raw === "string" ? raw.slice(0, 240) : fallback;
}

async function getUberToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const { clientId, clientSecret } = credentials();
  if (!clientId || !clientSecret) throw new UberError("Credenciais da Uber Direct não configuradas.");

  const response = await fetch(UBER_AUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
  });
  const text = await response.text();
  let body: { access_token?: string; expires_in?: number } = {};
  try { body = JSON.parse(text) as typeof body; } catch { /* resposta inválida tratada abaixo */ }
  console.info("[uber-direct] autenticação", { status: response.status });
  if (!response.ok || !body.access_token) {
    throw new UberError(safeProviderMessage(body, "A Uber recusou a autenticação."), response.status);
  }
  tokenCache = {
    token: body.access_token,
    expiresAt: Date.now() + Math.max(60, Number(body.expires_in ?? 3600)) * 1000,
  };
  return tokenCache.token;
}

async function uber<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const token = await getUberToken();
  const response = await fetch(`${UBER_API}${path}`, {
    method: init.method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await response.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
  console.info("[uber-direct] resposta", { path, method: init.method, status: response.status });
  if (!response.ok) throw new UberError(safeProviderMessage(body, `Uber Direct respondeu ${response.status}.`), response.status);
  return body as T;
}

function fullAddress(data: z.infer<typeof quoteSchema>) {
  return `${data.street}, ${data.number} - ${data.district}, ${data.city}/${data.state}, CEP ${data.cep.replace(/\D/g, "")}`;
}

async function requestQuote(data: z.infer<typeof quoteSchema>): Promise<UberQuoteResponse> {
  const { customerId } = credentials();
  const pickup = pickupConfig();
  if (!customerId || pickup.missing.length || !pickup.address) {
    return { fee: 0, error: "not_configured", message: "A entrega Uber Direct ainda não está configurada." };
  }
  try {
    const result = await uber<Record<string, unknown>>(
      `/customers/${encodeURIComponent(customerId)}/delivery_quotes`,
      {
        method: "POST",
        body: {
          pickup_address: pickup.address,
          dropoff_address: fullAddress(data),
          manifest_total_value: Math.round(data.subtotal * 100),
          external_store_id: "js-store-joinville",
        },
      },
    );
    const cents = Number(result["fee"] ?? 0);
    if (!Number.isFinite(cents) || cents <= 0 || typeof result["id"] !== "string") {
      return { fee: 0, error: "no_quote", message: "A Uber não retornou uma cotação para este endereço." };
    }
    const durationSeconds = Number(result["duration"] ?? 0);
    return {
      fee: +(cents / 100).toFixed(2),
      estimatedMinutes: durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : undefined,
      quoteId: result["id"],
      expiresAt: typeof result["expires"] === "string" ? result["expires"] : undefined,
      dropoffEta: typeof result["dropoff_eta"] === "string" ? result["dropoff_eta"] : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar a Uber Direct.";
    return { fee: 0, error: error instanceof UberError && error.status === 401 ? "auth_error" : "upstream_error", message };
  }
}

export const quoteUberDirect = createServerFn({ method: "POST" })
  .inputValidator((input) => quoteSchema.parse(input))
  .handler(async ({ data }) => requestQuote(data));

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  shipping_method: string | null;
  subtotal: number;
  uber_quote_id: string | null;
  uber_quote_expires_at: string | null;
  uber_delivery_id: string | null;
  uber_delivery_fee: number | null;
  uber_delivery_status: string | null;
  uber_tracking_url: string | null;
  uber_pickup_eta: string | null;
  uber_dropoff_eta: string | null;
  uber_updated_at: string | null;
  uber_failure_reason: string | null;
  addresses: { cep: string; street: string; number: string; district: string; city: string; state: string } | null;
  customers: { name: string; phone: string | null } | null;
  order_items: Array<{ product_name: string; quantity: number; unit_price: number }>;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Acesso administrativo necessário.");
}

async function loadOrder(orderId: string): Promise<OrderRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id,order_number,status,shipping_method,subtotal,uber_quote_id,uber_quote_expires_at,uber_delivery_id,uber_delivery_fee,uber_delivery_status,uber_tracking_url,uber_pickup_eta,uber_dropoff_eta,uber_updated_at,uber_failure_reason,addresses(cep,street,number,district,city,state),customers(name,phone),order_items(product_name,quantity,unit_price)")
    .eq("id", orderId)
    .single();
  if (error || !data) throw new Error("Pedido não encontrado.");
  return data as unknown as OrderRow;
}

async function patchOrder(orderId: string, values: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("orders").update(values).eq("id", orderId);
  if (error) throw new Error("Não foi possível atualizar os dados da entrega.");
}

function toState(order: OrderRow, extra: Partial<UberDeliveryState> = {}): UberDeliveryState {
  return {
    ok: true,
    quoteId: order.uber_quote_id,
    quoteExpiresAt: order.uber_quote_expires_at,
    deliveryId: order.uber_delivery_id,
    fee: order.uber_delivery_fee == null ? null : Number(order.uber_delivery_fee),
    status: order.uber_delivery_status,
    trackingUrl: order.uber_tracking_url,
    pickupEta: order.uber_pickup_eta,
    dropoffEta: order.uber_dropoff_eta,
    updatedAt: order.uber_updated_at,
    failureReason: order.uber_failure_reason,
    ...extra,
  };
}

function orderAddress(order: OrderRow) {
  const address = order.addresses;
  if (!address) return null;
  return {
    cep: address.cep,
    street: address.street,
    number: address.number,
    district: address.district,
    city: address.city,
    state: address.state,
    subtotal: Number(order.subtotal),
  };
}

export const getUberDeliveryState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try { return toState(await loadOrder(data.orderId)); }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Erro ao carregar a entrega." }; }
  });

export const refreshUberQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }): Promise<UberDeliveryState> => {
    await assertAdmin(context);
    const order = await loadOrder(data.orderId);
    if (order.uber_delivery_id) return toState(order, { ok: false, message: "A entrega já foi solicitada." });
    const address = orderAddress(order);
    if (!address) return toState(order, { ok: false, message: "Pedido sem endereço de entrega." });
    const quote = await requestQuote(address);
    if (quote.error || !quote.quoteId) return toState(order, { ok: false, message: quote.message ?? "Cotação indisponível." });
    await patchOrder(order.id, {
      uber_quote_id: quote.quoteId,
      uber_quote_expires_at: quote.expiresAt ?? null,
      uber_delivery_fee: quote.fee,
      uber_dropoff_eta: quote.dropoffEta ?? null,
      uber_delivery_status: "quoted",
      uber_updated_at: new Date().toISOString(),
      uber_failure_reason: null,
    });
    return { ...toState(order), quoteId: quote.quoteId, quoteExpiresAt: quote.expiresAt ?? null, fee: quote.fee, dropoffEta: quote.dropoffEta ?? null, status: "quoted", message: "Cotação Uber atualizada." };
  });

export const createUberDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }): Promise<UberDeliveryState> => {
    await assertAdmin(context);
    const order = await loadOrder(data.orderId);
    if (order.status !== "pago") return toState(order, { ok: false, message: "Confirme o pagamento antes de solicitar a entrega." });
    if (!order.shipping_method?.toLowerCase().includes("uber")) return toState(order, { ok: false, message: "Este pedido não selecionou Uber Direct." });
    if (order.uber_delivery_id) return toState(order, { message: "A entrega Uber já foi criada." });
    if (!order.uber_quote_id) return toState(order, { ok: false, message: "Atualize a cotação antes de solicitar o motorista." });
    if (order.uber_quote_expires_at && new Date(order.uber_quote_expires_at).getTime() <= Date.now()) {
      return toState(order, { ok: false, message: "A cotação expirou. Atualize o valor antes de continuar." });
    }
    const { customerId } = credentials();
    const pickup = pickupConfig();
    const address = orderAddress(order);
    const missing = [
      !customerId && "Customer ID da Uber",
      ...pickup.missing,
      !address && "endereço do cliente",
      !order.customers?.phone && "telefone do cliente",
    ].filter((value): value is string => Boolean(value));
    if (missing.length || !customerId || !pickup.address || !pickup.name || !pickup.phone || !address) {
      return toState(order, { ok: false, message: "Há dados obrigatórios pendentes.", missingData: missing });
    }

    try {
      const result = await uber<Record<string, unknown>>(`/customers/${encodeURIComponent(customerId)}/deliveries`, {
        method: "POST",
        body: {
          quote_id: order.uber_quote_id,
          pickup_name: pickup.name,
          pickup_address: pickup.address,
          pickup_phone_number: pickup.phone,
          pickup_notes: pickup.instructions,
          dropoff_name: order.customers?.name,
          dropoff_address: fullAddress(address),
          dropoff_phone_number: order.customers?.phone,
          manifest_description: `Pedido ${order.order_number} — J&S Store`,
          manifest_total_value: Math.round(Number(order.subtotal) * 100),
          external_id: order.order_number,
          manifest_items: order.order_items.map((item) => ({
            name: item.product_name.slice(0, 120),
            quantity: item.quantity,
            price: Math.round(Number(item.unit_price) * 100),
          })),
        },
      });
      const deliveryId = typeof result["id"] === "string" ? result["id"] : null;
      if (!deliveryId) return toState(order, { ok: false, message: "A Uber não retornou o identificador da entrega." });
      const patch = {
        uber_delivery_id: deliveryId,
        uber_delivery_status: String(result["status"] ?? "pending"),
        uber_tracking_url: typeof result["tracking_url"] === "string" ? result["tracking_url"] : null,
        uber_pickup_eta: typeof result["pickup_eta"] === "string" ? result["pickup_eta"] : null,
        uber_dropoff_eta: typeof result["dropoff_eta"] === "string" ? result["dropoff_eta"] : order.uber_dropoff_eta,
        uber_updated_at: new Date().toISOString(),
        uber_failure_reason: null,
      };
      await patchOrder(order.id, patch);
      return { ...toState(order), ...patch, deliveryId, status: patch.uber_delivery_status, trackingUrl: patch.uber_tracking_url, pickupEta: patch.uber_pickup_eta, dropoffEta: patch.uber_dropoff_eta, message: "Entrega solicitada à Uber Direct." };
    } catch (error) {
      return toState(order, { ok: false, message: error instanceof Error ? error.message : "A Uber não criou a entrega." });
    }
  });

export const refreshUberDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }): Promise<UberDeliveryState> => {
    await assertAdmin(context);
    const order = await loadOrder(data.orderId);
    const { customerId } = credentials();
    if (!customerId || !order.uber_delivery_id) return toState(order, { ok: false, message: "Este pedido ainda não possui entrega Uber." });
    try {
      const result = await uber<Record<string, unknown>>(`/customers/${encodeURIComponent(customerId)}/deliveries/${encodeURIComponent(order.uber_delivery_id)}`, { method: "GET" });
      const status = String(result["status"] ?? order.uber_delivery_status ?? "pending");
      const patch = {
        uber_delivery_status: status,
        uber_tracking_url: typeof result["tracking_url"] === "string" ? result["tracking_url"] : order.uber_tracking_url,
        uber_pickup_eta: typeof result["pickup_eta"] === "string" ? result["pickup_eta"] : order.uber_pickup_eta,
        uber_dropoff_eta: typeof result["dropoff_eta"] === "string" ? result["dropoff_eta"] : order.uber_dropoff_eta,
        uber_updated_at: new Date().toISOString(),
      };
      await patchOrder(order.id, patch);
      return { ...toState(order), status, trackingUrl: patch.uber_tracking_url, pickupEta: patch.uber_pickup_eta, dropoffEta: patch.uber_dropoff_eta, updatedAt: patch.uber_updated_at, message: "Status da Uber atualizado." };
    } catch (error) {
      return toState(order, { ok: false, message: error instanceof Error ? error.message : "Não foi possível atualizar a entrega." });
    }
  });

export const cancelUberDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data, context }): Promise<UberDeliveryState> => {
    await assertAdmin(context);
    const order = await loadOrder(data.orderId);
    const { customerId } = credentials();
    if (!customerId || !order.uber_delivery_id) return toState(order, { ok: false, message: "Este pedido ainda não possui entrega Uber." });
    try {
      await uber(`/customers/${encodeURIComponent(customerId)}/deliveries/${encodeURIComponent(order.uber_delivery_id)}`, { method: "DELETE" });
      const updatedAt = new Date().toISOString();
      await patchOrder(order.id, { uber_delivery_status: "canceled", uber_updated_at: updatedAt, uber_failure_reason: "Cancelado pela loja" });
      return { ...toState(order), status: "canceled", updatedAt, failureReason: "Cancelado pela loja", message: "Entrega Uber cancelada. O pagamento do pedido não foi alterado." };
    } catch (error) {
      return toState(order, { ok: false, message: error instanceof Error ? error.message : "A Uber recusou o cancelamento." });
    }
  });
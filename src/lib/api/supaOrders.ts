import { supabase } from "@/lib/supabaseClient";
import type { PaymentMethod } from "@/lib/integrations/payment";

export interface NewOrderInput {
  customer: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    user_id?: string | null;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  items: {
    product_id: string | null;
    product_name: string;
    variant_size?: string;
    variant_color?: string;
    unit_price: number;
    quantity: number;
  }[];
  subtotal: number;
  shipping_cost: number;
  shipping_method: string;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface CreatedOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
}

export async function createOrder(input: NewOrderInput): Promise<CreatedOrder> {
  // 1) upsert do customer (por email + user_id quando disponível)
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("email", input.customer.email.toLowerCase())
    .maybeSingle();

  let customerId = existing?.id as string | undefined;
  if (!customerId) {
    const { data: ins, error } = await supabase
      .from("customers")
      .insert({
        name: input.customer.name,
        email: input.customer.email.toLowerCase(),
        phone: input.customer.phone ?? null,
        cpf: input.customer.cpf ?? null,
        user_id: input.customer.user_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    customerId = ins.id;
  }

  // 2) endereço
  const { data: addr, error: addrErr } = await supabase
    .from("addresses")
    .insert({
      customer_id: customerId,
      cep: input.address.cep.replace(/\D/g, ""),
      street: input.address.street,
      number: input.address.number,
      complement: input.address.complement ?? null,
      district: input.address.district,
      city: input.address.city,
      state: input.address.state,
    })
    .select("id")
    .single();
  if (addrErr) throw addrErr;

  // 3) order
  const { data: order, error: ordErr } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      address_id: addr.id,
      subtotal: input.subtotal,
      shipping_cost: input.shipping_cost,
      shipping_method: input.shipping_method,
      discount: input.discount,
      total: input.total,
      payment_method: input.payment_method,
      notes: input.notes ?? null,
      status: "aguardando_pagamento",
    })
    .select("id, order_number, total, status")
    .single();
  if (ordErr) throw ordErr;

  // 4) items
  const itemsRows = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    variant_size: i.variant_size ?? null,
    variant_color: i.variant_color ?? null,
    unit_price: i.unit_price,
    quantity: i.quantity,
    subtotal: +(i.unit_price * i.quantity).toFixed(2),
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemsRows);
  if (itemsErr) throw itemsErr;

  return order as CreatedOrder;
}

export interface OrderFull {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_provider: string | null;
  payment_url: string | null;
  shipping_method: string | null;
  tracking_code: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  customer: { id: string; name: string; email: string; phone: string | null; cpf: string | null };
  address: { cep: string; street: string; number: string; complement: string | null; district: string; city: string; state: string } | null;
  items: { id: string; product_name: string; variant_size: string | null; variant_color: string | null; unit_price: number; quantity: number; subtotal: number }[];
}

const FULL_SELECT = `
  id, order_number, status, subtotal, shipping_cost, discount, total,
  payment_method, payment_provider, payment_url, shipping_method, tracking_code,
  notes, created_at, paid_at,
  customer:customers(id, name, email, phone, cpf),
  address:addresses(cep, street, number, complement, district, city, state),
  items:order_items(id, product_name, variant_size, variant_color, unit_price, quantity, subtotal)
`;

export async function getOrderByNumber(orderNumber: string): Promise<OrderFull | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(FULL_SELECT)
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as OrderFull | null;
}

export async function listMyOrders(): Promise<OrderFull[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(FULL_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderFull[];
}

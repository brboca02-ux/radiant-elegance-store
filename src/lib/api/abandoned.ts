import { supabase } from "@/integrations/supabase/client";

export interface AbandonedCart {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  cart_data: any;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  last_updated_at: string;
  recovered_at: string | null;
  order_id: string | null;
  created_at: string;
}

export async function upsertAbandonedCart(input: Partial<AbandonedCart>) {
  // We identify by email or phone to update existing records if possible
  // For simplicity in this implementation, we'll use email/phone as identifiers
  if (!input.customer_email && !input.customer_phone) return;

  const identifier = input.customer_email || input.customer_phone;
  
  // Try to find an existing non-recovered cart for this user in the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: existing } = await supabase
    .from("abandoned_carts")
    .select("id")
    .or(`customer_email.eq.${input.customer_email},customer_phone.eq.${input.customer_phone}`)
    .is("recovered_at", null)
    .gt("created_at", oneDayAgo)
    .order("last_updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const data = {
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    customer_phone: input.customer_phone,
    cart_data: input.cart_data,
    subtotal: input.subtotal,
    shipping_cost: input.shipping_cost,
    discount: input.discount,
    total: input.total,
    last_updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("abandoned_carts")
      .update(data)
      .eq("id", existing.id);
    if (error) console.error("Error updating abandoned cart:", error);
  } else {
    const { error } = await supabase
      .from("abandoned_carts")
      .insert(data);
    if (error) console.error("Error inserting abandoned cart:", error);
  }
}

export async function loadAbandonedCarts(): Promise<AbandonedCart[]> {
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .is("recovered_at", null)
    .is("order_id", null)
    .order("last_updated_at", { ascending: false });
    
  if (error) throw new Error(error.message);
  return (data || []) as AbandonedCart[];
}

export async function markAsRecovered(id: string) {
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ recovered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function buildAbandonmentWhatsAppLink(cart: AbandonedCart) {
  const items = cart.cart_data.items || [];
  const itemsList = items.map((i: any) => `- ${i.quantity}x ${i.product.node.title}`).join("\n");
  
  const message = `Olá ${cart.customer_name || ""}! Notamos que você deixou alguns itens incríveis na sua sacola na J&S Store:\n\n${itemsList}\n\nAinda dá tempo de garantir as suas peças! Clique aqui para finalizar sua compra: https://jsstore.lovable.app/checkout\n\nQualquer dúvida, estamos à disposição!`;
  
  const phone = (cart.customer_phone || "").replace(/\D/g, "");
  return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
}

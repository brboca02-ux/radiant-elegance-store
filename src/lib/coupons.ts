import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

const STORAGE_KEY = "md_coupons_v1";

export async function loadCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from("coupons" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) return data as unknown as Coupon[];
  } catch (e) {
    console.warn("Could not load coupons from Supabase, falling back to local storage.");
  }

  // Fallback to local storage
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export async function saveCoupon(coupon: Omit<Coupon, "id" | "created_at" | "usage_count">) {
  try {
    const { error } = await supabase
      .from("coupons" as any)
      .upsert({
        ...coupon,
        code: coupon.code.toUpperCase().trim(),
        updated_at: new Date().toISOString()
      } as any);
    
    if (!error) return;
  } catch (e) {
    console.warn("Failed to save coupon to Supabase");
  }

  // Fallback
  if (typeof window !== "undefined") {
    const list = await loadCoupons();
    const newCoupon = {
      ...coupon,
      id: crypto.randomUUID(),
      usage_count: 0,
      created_at: new Date().toISOString()
    };
    list.push(newCoupon);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export async function deleteCoupon(id: string) {
  try {
    const { error } = await supabase
      .from("coupons" as any)
      .delete()
      .eq("id", id);
    
    if (!error) return;
  } catch (e) {
    console.warn("Failed to delete coupon from Supabase");
  }

  // Fallback
  if (typeof window !== "undefined") {
    const list = await loadCoupons();
    const next = list.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const c = code.toUpperCase().trim();
  const coupons = await loadCoupons();
  const coupon = coupons.find(x => x.code === c && x.is_active);
  
  if (!coupon) return null;
  
  // Expiry check
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
  
  // Usage limit check
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return null;
  
  return coupon;
}

export function calculateDiscount(subtotal: number, coupon: Coupon): number {
  if (coupon.type === "percentage") {
    return (subtotal * coupon.value) / 100;
  }
  return Math.min(subtotal, coupon.value);
}

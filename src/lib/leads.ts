import { supabase } from "@/integrations/supabase/client";

export type LeadSource = "newsletter" | "footer" | "welcome_popup" | "exit_intent";

export interface Lead {
  id?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  /** Legacy fields kept for back-compat */
  type?: "email" | "whatsapp";
  value?: string;
  source?: LeadSource | string;
  created_at?: string;
  at?: string; // for compatibility with existing code
}

const STORAGE_KEY = "md_leads_v1";

export function loadLeadsLocal(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export async function loadLeads(): Promise<Lead[]> {
  // Try to load from Supabase if possible
  try {
    const { data, error } = await supabase
      .from("leads" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data as any[]).map(l => ({
        id: l.id,
        name: l.name || undefined,
        email: l.email || undefined,
        whatsapp: l.phone || undefined,
        source: l.source || undefined,
        created_at: l.created_at,
        at: l.created_at
      }));
    }
  } catch (e) {
    console.warn("Could not load leads from Supabase, falling back to local storage.");
  }

  // Fallback to local storage
  return loadLeadsLocal();
}

export async function saveLead(lead: Lead) {
  // Save to local storage first for immediate feedback
  if (typeof window !== "undefined") {
    try {
      const list = loadLeadsLocal();
      list.push({ ...lead, at: lead.at || new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save lead to localStorage");
    }
  }

  // Then try Supabase
  try {
    await supabase
      .from("leads" as any)
      .insert({
        name: lead.name,
        email: lead.email,
        phone: lead.whatsapp,
        source: lead.source
      } as any);
  } catch (e) {
    console.warn("Failed to save lead to Supabase");
  }
}

export function hasAnyLead(): boolean {
  if (typeof window === "undefined") return false;
  return loadLeadsLocal().length > 0;
}

export function cleanEmail(v: string) {
  return v.trim().slice(0, 254);
}

export function cleanPhone(v: string) {
  return v.replace(/[^\d+]/g, "").slice(0, 16);
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function isValidPhone(v: string) {
  return v.replace(/\D/g, "").length >= 10;
}

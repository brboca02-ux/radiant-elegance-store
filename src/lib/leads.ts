import { supabase } from "@/integrations/supabase/client";

export type LeadSource = "newsletter" | "footer" | "welcome_popup" | "exit_intent";

export interface Lead {
  id?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  source?: LeadSource | string;
  created_at?: string;
}

export async function loadLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading leads:", error);
    return [];
  }

  return (data || []).map(l => ({
    id: l.id,
    name: l.name || undefined,
    email: l.email || undefined,
    whatsapp: l.phone || undefined,
    source: l.source || undefined,
    created_at: l.created_at
  }));
}

export async function saveLead(lead: Omit<Lead, "id" | "created_at">) {
  const { error } = await supabase
    .from("leads")
    .insert({
      name: lead.name,
      email: lead.email,
      phone: lead.whatsapp,
      source: lead.source
    });

  if (error) {
    console.error("Error saving lead:", error);
    throw error;
  }
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

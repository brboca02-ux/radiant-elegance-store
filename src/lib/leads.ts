// Shared lead persistence (localStorage). Backward compatible with older entries.
export type LeadSource = "newsletter" | "footer" | "welcome_popup" | "exit_intent";

export interface Lead {
  name?: string;
  email?: string;
  whatsapp?: string;
  /** Legacy fields kept for back-compat with older v1 entries */
  type?: "email" | "whatsapp";
  value?: string;
  source?: LeadSource;
  at: string;
}

const STORAGE_KEY = "md_leads_v1";

export function loadLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead) {
  if (typeof window === "undefined") return;
  try {
    const list = loadLeads();
    list.push(lead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota
  }
}

export function hasAnyLead(): boolean {
  return loadLeads().length > 0;
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

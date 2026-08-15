import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export const STORE_ID = "store_js_store";

export type CustomerStatus = "ativo" | "vip" | "inativo";

export interface CustomerMessage {
  id: string;
  customer_id: string;
  channel: "whatsapp" | "email" | "manual";
  direction: "in" | "out";
  body: string;
  user_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf?: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at?: string | null;
  status: CustomerStatus;
  notes?: string;
  messages: CustomerMessage[];
  created_at: string;
}

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  hydrate: () => Promise<void>;
  get: (id: string) => Promise<Customer | null>;
  update: (id: string, patch: Partial<Omit<Customer, "id" | "messages">>) => Promise<void>;
  addMessage: (id: string, m: Omit<CustomerMessage, "id" | "customer_id" | "created_at">) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("customer_id, total, status, created_at");

      if (ordersError) throw ordersError;

      const mapped: Customer[] = (data || []).map(c => {
        const customerOrders = orders?.filter(o => o.customer_id === c.id) || [];
        const paidOrders = customerOrders.filter(o => ['pago', 'entregue', 'enviado', 'separando'].includes(o.status));
        
        const lastOrder = customerOrders.length > 0 
          ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          whatsapp: c.phone || "",
          cpf: c.cpf,
          total_orders: customerOrders.length,
          total_spent: paidOrders.reduce((acc, o) => acc + (o.total || 0), 0),
          last_order_at: lastOrder?.created_at || null,
          status: "ativo",
          notes: "",
          messages: [],
          created_at: c.created_at,
        };
      });

      set({ customers: mapped, loading: false });
    } catch (e) {
      console.error("Error hydrating customers:", e);
      set({ loading: false });
    }
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      whatsapp: data.phone || "",
      cpf: data.cpf,
      total_orders: 0,
      total_spent: 0,
      status: "ativo",
      notes: "",
      messages: [],
      created_at: data.created_at,
    };
  },

  update: async (id, patch) => {
    // Optimistic update
    set(s => ({
      customers: s.customers.map(c => c.id === id ? { ...c, ...patch } : c)
    }));

    // In a real scenario, we would update Supabase here
    await supabase.from("customers").update({
      name: patch.name,
      email: patch.email,
      phone: patch.whatsapp,
      cpf: patch.cpf
    }).eq("id", id);
  },

  addMessage: async (id, m) => {
    // Placeholder for real message storage
    set(s => ({
      customers: s.customers.map(c => c.id === id ? {
        ...c,
        messages: [...c.messages, { ...m, id: Math.random().toString(), customer_id: id, created_at: new Date().toISOString() }]
      } : c)
    }));
  }
}));

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const statusTone: Record<CustomerStatus, string> = {
  ativo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  vip: "bg-amber-50 text-amber-700 ring-amber-200",
  inativo: "bg-slate-100 text-slate-700 ring-slate-200",
};

export const statusLabel: Record<CustomerStatus, string> = {
  ativo: "Ativo",
  vip: "VIP",
  inativo: "Inativo",
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
export const whatsAppHref = (phone: string, msg = "") =>
  `https://wa.me/${onlyDigits(phone)}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

export const customerToCsv = (c: Customer) => {
  const rows = [
    ["id", c.id], ["nome", c.name], ["email", c.email], ["whatsapp", c.whatsapp],
    ["status", statusLabel[c.status]], ["pedidos", String(c.total_orders)],
    ["total_spent", String(c.total_spent)], ["cadastro", fmtDate(c.created_at)],
  ];
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
};

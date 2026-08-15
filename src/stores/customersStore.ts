import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export const STORE_ID = "store_js_store";

export type CustomerStatus = "ativo" | "vip" | "inativo";

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
  created_at: string;
}

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  hydrate: () => Promise<void>;
  get: (id: string) => Promise<Customer | null>;
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

      // Transform data to fit Customer interface if needed
      // Currently the table columns match well enough, but we might want to calculate stats
      // if they aren't directly in the table. 
      // The `customers` table in types.ts has: cpf, created_at, email, id, name, phone, updated_at, user_id
      // It lacks total_orders and total_spent which were in the local store.
      
      // We'll fetch total stats from orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("customer_id, total, status");

      if (ordersError) throw ordersError;

      const mapped: Customer[] = (data || []).map(c => {
        const customerOrders = orders?.filter(o => o.customer_id === c.id) || [];
        const paidOrders = customerOrders.filter(o => o.status === 'pago' || o.status === 'entregue' || o.status === 'enviado' || o.status === 'separando');
        
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          whatsapp: c.phone || "",
          cpf: c.cpf,
          total_orders: customerOrders.length,
          total_spent: paidOrders.reduce((acc, o) => acc + (o.total || 0), 0),
          last_order_at: null, // Would need more complex query or join
          status: "ativo", // Default status
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
    
    // Simple return for detail view
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      whatsapp: data.phone || "",
      cpf: data.cpf,
      total_orders: 0,
      total_spent: 0,
      status: "ativo",
      created_at: data.created_at,
    };
  }
}));

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

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

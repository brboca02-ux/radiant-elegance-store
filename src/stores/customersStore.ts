import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const STORE_ID = "store_md_modas";

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
  store_id: string;
  name: string;
  email: string;
  whatsapp: string;
  doc?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  status: CustomerStatus;
  notes?: string;
  messages: CustomerMessage[];
  created_at: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const seed: Customer[] = [];

interface CustomersState {
  customers: Customer[];
  list: () => Customer[];
  get: (id: string) => Customer | undefined;
  update: (id: string, patch: Partial<Omit<Customer, "id" | "messages">>) => void;
  addMessage: (id: string, m: Omit<CustomerMessage, "id" | "customer_id" | "created_at">) => void;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: seed,
      list: () => get().customers,
      get: (id) => get().customers.find((c) => c.id === id),
      update: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addMessage: (id, m) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { ...m, id: uid(), customer_id: id, created_at: new Date().toISOString() },
                  ],
                }
              : c,
          ),
        })),
    }),
    { name: "md_customers_v1", storage: createJSONStorage(() => localStorage) },
  ),
);

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso?: string) =>
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
    ["total_gasto", String(c.total_spent)], ["ultima_compra", fmtDate(c.last_order_at)],
    ["cadastro", fmtDate(c.created_at)],
  ];
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
};

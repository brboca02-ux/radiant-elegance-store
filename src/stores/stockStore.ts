import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORE_ID, useProductsStore } from "./productsStore";

export type MovementType = "entrada" | "saida" | "ajuste";

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  type: MovementType;
  quantity: number; // entrada: +, saida: -, ajuste: novo valor absoluto
  reason: string;
  notes: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

const uid = () => "m_" + Math.random().toString(36).slice(2, 10);

const seedMovements: StockMovement[] = [];

interface StockState {
  movements: StockMovement[];
  list: () => StockMovement[];
  record: (input: {
    product_id: string;
    type: MovementType;
    quantity: number; // entrada/saida: positivo; ajuste: novo total absoluto
    reason: string;
    notes?: string;
  }) => StockMovement | undefined;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      movements: seedMovements,
      list: () => get().movements.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)),
      record: ({ product_id, type, quantity, reason, notes }) => {
        const prodStore = useProductsStore.getState();
        const product = prodStore.get(product_id);
        if (!product) return undefined;

        let signedQty = 0;
        if (type === "entrada") {
          signedQty = Math.abs(quantity);
          prodStore.adjustStock(product_id, signedQty);
        } else if (type === "saida") {
          signedQty = -Math.abs(quantity);
          prodStore.adjustStock(product_id, signedQty);
        } else {
          signedQty = Math.max(0, quantity); // novo total absoluto
          prodStore.setStock(product_id, signedQty);
        }

        const m: StockMovement = {
          id: uid(), store_id: STORE_ID, product_id, product_name: product.name,
          type, quantity: signedQty, reason: reason || "—", notes: notes || "",
          user_id: "u_admin", user_name: "Admin",
          created_at: new Date().toISOString(),
        };
        set((s) => ({ movements: [m, ...s.movements] }));
        return m;
      },
    }),
    { name: "md_stock_v2", storage: createJSONStorage(() => localStorage) },
  ),
);

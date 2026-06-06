// Lightweight analytics helper for GA4 + Meta Pixel.
// Safely no-ops when the IDs are not configured.
type Params = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const hasGA = () => typeof window !== "undefined" && typeof window.gtag === "function";
const hasPixel = () => typeof window !== "undefined" && typeof window.fbq === "function";

function ga(event: string, params?: Params) {
  if (hasGA()) window.gtag!("event", event, params ?? {});
}
function pixel(event: string, params?: Params, custom = false) {
  if (hasPixel()) window.fbq!(custom ? "trackCustom" : "track", event, params ?? {});
}

export const track = {
  viewItem(p: { id: string; name: string; price: number; currency?: string }) {
    ga("view_item", {
      currency: p.currency ?? "BRL",
      value: p.price,
      items: [{ item_id: p.id, item_name: p.name, price: p.price }],
    });
    pixel("ViewContent", { content_ids: [p.id], content_name: p.name, value: p.price, currency: p.currency ?? "BRL" });
  },
  addToCart(p: { id: string; name: string; price: number; quantity?: number; currency?: string }) {
    const qty = p.quantity ?? 1;
    ga("add_to_cart", {
      currency: p.currency ?? "BRL",
      value: p.price * qty,
      items: [{ item_id: p.id, item_name: p.name, price: p.price, quantity: qty }],
    });
    pixel("AddToCart", { content_ids: [p.id], content_name: p.name, value: p.price * qty, currency: p.currency ?? "BRL" });
  },
  beginCheckout(p: { value: number; currency?: string; items?: Array<{ id: string; name: string; price: number; quantity: number }> }) {
    ga("begin_checkout", {
      currency: p.currency ?? "BRL",
      value: p.value,
      items: p.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    });
    pixel("InitiateCheckout", {
      value: p.value,
      currency: p.currency ?? "BRL",
      content_ids: p.items?.map((i) => i.id),
      num_items: p.items?.reduce((a, b) => a + b.quantity, 0),
    });
  },
  purchase(p: { value: number; currency?: string; transactionId?: string }) {
    ga("purchase", { transaction_id: p.transactionId, value: p.value, currency: p.currency ?? "BRL" });
    pixel("Purchase", { value: p.value, currency: p.currency ?? "BRL" });
  },
  search(query: string) {
    ga("search", { search_term: query });
    pixel("Search", { search_string: query });
  },
  whatsappClick(source: string) {
    ga("whatsapp_click", { source });
    pixel("Contact", { source }, true);
  },
  lead(source: string) {
    ga("generate_lead", { source });
    pixel("Lead", { source });
  },
  popupView(name: string) {
    ga("popup_view", { popup: name });
    pixel("PopupView", { popup: name }, true);
  },
  exitIntentView() {
    ga("exit_intent_view");
    pixel("ExitIntentView", {}, true);
  },
};

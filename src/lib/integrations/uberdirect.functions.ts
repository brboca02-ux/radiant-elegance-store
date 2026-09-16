import { supabase } from "@/integrations/supabase/client";

export interface UberQuoteInput {
  cep: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  subtotal: number;
}

export interface UberQuoteResponse {
  fee: number; // valor em R$
  estimatedMinutes?: number;
  quoteId?: string;
  error?: string;
}

/**
 * Invoca a Edge Function do Supabase para cotar entrega via Uber Direct
 */
export async function quoteUberDirect(input: UberQuoteInput): Promise<UberQuoteResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke("uber-direct-quote", {
      body: input,
    });

    if (error || !data) {
      console.warn("Erro ao cotar Uber Direct:", error);
      return null;
    }

    return data as UberQuoteResponse;
  } catch (err) {
    console.error("Falha na chamada Uber Direct:", err);
    return null;
  }
}
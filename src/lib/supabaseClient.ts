import { createClient } from "@supabase/supabase-js";

// Projeto Supabase externo (MD Modas — produção).
// Mantido hardcoded de propósito: o .env foi tomado pelo Lovable Cloud
// (banco vazio) e não pode ser editado. A anon key é publishable, seguro.
const SUPABASE_URL = "https://snqvhexeruvlyrtzsdnm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucXZoZXhlcnV2bHlydHpzZG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzE0NjUsImV4cCI6MjA5NzcwNzQ2NX0.VmGWqBvCCUIc19kQaJKnYht2d-J4FuonzT-deHRmWcw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

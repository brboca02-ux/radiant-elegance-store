import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://snqvhexeruvlyrtzsdnm.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucXZoZXhlcnV2bHlydHpzZG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzE0NjUsImV4cCI6MjA5NzcwNzQ2NX0.VmGWqBvCCUIc19kQaJKnYht2d-J4FuonzT-deHRmWcw";

// URL/anon key preferem .env (VITE_*), com fallback pros valores atuais
// para não quebrar dev sem .env local.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  FALLBACK_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

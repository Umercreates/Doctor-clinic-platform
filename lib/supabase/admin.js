/**
 * Supabase admin client — SERVER ONLY. Uses the secret key, which bypasses
 * Row Level Security and can manage auth users. Never expose it to the browser
 * and never prefix it with NEXT_PUBLIC_.
 */
import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin must never be imported into client-side code.");
}

export function isSupabaseAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

let adminClient = null;

export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig, isSupabaseConfigured } from "./env";

let browserClient = null;

/**
 * Browser Supabase client (singleton). Uses only the public URL and the
 * publishable key. It shares the auth session with the server through cookies.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}

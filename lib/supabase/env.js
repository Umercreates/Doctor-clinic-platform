/**
 * Supabase configuration helpers.
 *
 * The public URL and publishable key are safe for the browser and are inlined
 * by Next.js because they are referenced as literal `process.env.NEXT_PUBLIC_*`
 * expressions. The secret key is read only in `admin.js` (server-only).
 */

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return Boolean(url && publishableKey);
}

/** Shared cookie attributes for the Supabase auth cookies. */
export function getAuthCookieOptions() {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

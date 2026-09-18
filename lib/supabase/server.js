/**
 * Server-side Supabase clients (server components, layouts, route handlers).
 * Never import this file from client components.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getAuthCookieOptions, getSupabasePublicConfig, isSupabaseConfigured } from "./env";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase/server must never be imported into client-side code.");
}

/**
 * Client bound to the current request's cookie store (next/headers).
 * Cookie writes are ignored inside server components (Next.js forbids them
 * there); the proxy keeps sessions refreshed instead.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: safe to ignore (proxy refreshes sessions).
        }
      },
    },
  });
}

/**
 * Collects cookies/headers written by Supabase during a route handler so they
 * can be applied to whichever response the handler finally returns.
 */
export function createCookieJar() {
  const cookies = [];
  const headers = {};
  return {
    cookies,
    headers,
    applyTo(response) {
      cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    },
  };
}

/**
 * Client for route handlers that must SET cookies (sign-in / sign-out).
 * Reads cookies from the incoming request and records writes in `jar`.
 */
export function createSupabaseRouteClient(request, jar) {
  if (!isSupabaseConfigured()) return null;
  const { url, publishableKey } = getSupabasePublicConfig();
  return createServerClient(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        jar.cookies.push(...cookiesToSet);
        Object.assign(jar.headers, headers);
      },
    },
  });
}

/** Read-only client for route handlers that only need to identify the caller. */
export function createSupabaseRequestClient(request) {
  if (!isSupabaseConfigured()) return null;
  const { url, publishableKey } = getSupabasePublicConfig();
  return createServerClient(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Read-only: token refresh happens in the proxy.
      },
    },
  });
}

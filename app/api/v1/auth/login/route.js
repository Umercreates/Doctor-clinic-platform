import { NextResponse } from "next/server";
import { fail, readJson } from "@/server/http/response";
import { createCookieJar, createSupabaseRouteClient } from "@/lib/supabase/server";
import { getClientIp } from "@/server/auth/currentUser";
import { login, assertAuthConfigured } from "@/server/services/authService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/login  { email, password }
 * Authenticates through Supabase Auth; the Supabase session cookies are set
 * on this response. Returns only safe user fields.
 */
export async function POST(request) {
  try {
    assertAuthConfigured();
    const body = await readJson(request);
    const jar = createCookieJar();
    const supabase = createSupabaseRouteClient(request, jar);
    const result = await login(body, { supabase, ipAddress: getClientIp(request) });
    return jar.applyTo(NextResponse.json({ success: true, data: result }));
  } catch (error) {
    return fail(error);
  }
}

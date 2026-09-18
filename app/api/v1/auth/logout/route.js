import { NextResponse } from "next/server";
import { fail } from "@/server/http/response";
import { createCookieJar, createSupabaseRouteClient } from "@/lib/supabase/server";
import { logout } from "@/server/services/authService";

export const dynamic = "force-dynamic";

/** POST /api/v1/auth/logout — Supabase sign-out; auth cookies are cleared on this response. */
export async function POST(request) {
  try {
    const jar = createCookieJar();
    const supabase = createSupabaseRouteClient(request, jar);
    await logout({ supabase });
    return jar.applyTo(NextResponse.json({ success: true, data: { signedOut: true } }));
  } catch (error) {
    return fail(error);
  }
}

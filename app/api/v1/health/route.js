import { ok, withErrorHandling } from "@/server/http/response";
import { getDatabaseStatus, pingDatabase } from "@/lib/database";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health — liveness/readiness for uptime monitors. Deliberately
 * coarse: booleans only, no driver, host, latency or version details.
 */
export const GET = withErrorHandling(async () => {
  const database = getDatabaseStatus();
  const ping = await pingDatabase();
  const healthy = !database.configured || ping.ok;
  return ok(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: database.configured ? (ping.ok ? "ok" : "unreachable") : "not-configured",
      auth: isSupabaseConfigured() ? "ok" : "not-configured",
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
});

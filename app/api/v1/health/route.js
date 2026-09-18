import { ok, withErrorHandling } from "@/server/http/response";
import { getDatabaseStatus, pingDatabase } from "@/lib/database";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const database = getDatabaseStatus();
  const ping = await pingDatabase();
  return ok({
    status: database.configured && !ping.ok ? "degraded" : "ok",
    service: "doctor-clinic-api",
    version: "v1",
    timestamp: new Date().toISOString(),
    database: { ...database, reachable: ping.ok, ...(ping.latencyMs !== undefined ? { latencyMs: ping.latencyMs } : {}) },
    auth: { provider: "supabase", configured: isSupabaseConfigured() },
  });
});

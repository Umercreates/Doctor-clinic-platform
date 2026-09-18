import { ok, withErrorHandling } from "@/server/http/response";
import { getDatabaseStatus } from "@/lib/database";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  return ok({
    status: "ok",
    service: "doctor-clinic-api",
    version: "v1",
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  });
});

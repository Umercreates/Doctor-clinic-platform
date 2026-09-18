import { created, ok, readJson, withErrorHandling } from "@/server/http/response";
import { ApiError } from "@/server/http/errors";
import { requireScopedPermission, requireUser } from "@/server/auth/currentUser";
import { isIsoDate } from "@/lib/dates";
import { isUuid } from "@/lib/validation/common";
import { createScheduleBlock, listAvailability } from "@/server/services/scheduleService";

export const dynamic = "force-dynamic";

/** GET /api/v1/availability?doctorId=&from=&to=&includeInactive=1 — weekly blocks + exceptions (scoped). */
export const GET = withErrorHandling(async (request) => {
  const { scope } = await requireScopedPermission(request, "availability:read");
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  if (doctorId && !isUuid(doctorId)) throw ApiError.badRequest("doctorId is not valid.");
  if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) throw ApiError.badRequest("from/to must be YYYY-MM-DD.");
  const includeInactive = searchParams.get("includeInactive") === "1";
  const data = await listAvailability(scope, { doctorId, from, to, includeInactive });
  return ok(data, { headers: { "Cache-Control": "no-store" } });
});

/** POST /api/v1/availability — add a weekly schedule block { doctorId, weekday, start, end }. */
export const POST = withErrorHandling(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  return created(await createScheduleBlock(user, body));
});

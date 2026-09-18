import { ApiError } from "@/server/http/errors";
import { ok, withErrorHandling } from "@/server/http/response";
import { getAvailableDays } from "@/server/services/availabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/appointments/availability/days?doctor=&service=&from=&to=
 * Public. Dates in the range that still have at least one open slot.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctor");
  const serviceId = searchParams.get("service");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!doctorId || !serviceId) throw ApiError.badRequest("The `doctor` and `service` query parameters are required.");
  if (!from || !to) throw ApiError.badRequest("The `from` and `to` query parameters are required.");
  const result = await getAvailableDays({ doctorId, serviceId, from, to });
  return ok(result, { headers: { "Cache-Control": "no-store" } });
});

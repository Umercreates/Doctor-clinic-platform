import { ApiError } from "@/server/http/errors";
import { ok, withErrorHandling } from "@/server/http/response";
import { getAvailability } from "@/server/services/availabilityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/appointments/availability?doctor=&service=&date=YYYY-MM-DD
 * Public. Returns every slot start for the day with `available` computed from
 * the doctor's schedule, exceptions and existing appointments.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctor");
  const serviceId = searchParams.get("service");
  const date = searchParams.get("date");

  if (!doctorId) throw ApiError.badRequest("The `doctor` query parameter is required.");
  if (!serviceId) throw ApiError.badRequest("The `service` query parameter is required.");
  if (!date) throw ApiError.badRequest("The `date` query parameter is required.");

  const availability = await getAvailability({ doctorId, serviceId, date });
  return ok(availability, {
    meta: { available: availability.slots.filter((s) => s.available).length, total: availability.slots.length },
    headers: { "Cache-Control": "no-store" },
  });
});

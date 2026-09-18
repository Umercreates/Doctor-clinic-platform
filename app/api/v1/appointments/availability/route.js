import { ApiError } from "@/server/http/errors";
import { ok, withErrorHandling } from "@/server/http/response";
import { getAvailability } from "@/server/services/availabilityService";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctor");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service") || undefined;

  if (!doctorId) throw ApiError.badRequest("The `doctor` query parameter is required.");
  if (!date) throw ApiError.badRequest("The `date` query parameter is required.");

  const availability = await getAvailability({ doctorId, date, serviceId });
  return ok(availability, {
    meta: { available: availability.slots.filter((s) => s.available).length },
    headers: { "Cache-Control": "no-store" },
  });
});

import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { ApiError } from "@/server/http/errors";
import { requireUser } from "@/server/auth/currentUser";
import { isUuid } from "@/lib/validation/common";
import { getRescheduleOptions, rescheduleAppointmentForUser } from "@/server/services/appointmentService";

export const dynamic = "force-dynamic";

async function paramId(params) {
  const { id } = await params;
  if (!isUuid(id)) throw ApiError.badRequest("Appointment identifier is not valid.");
  return id;
}

/** GET /api/v1/appointments/:id/reschedule?date= — slots the appointment could move to (scoped). */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) throw ApiError.badRequest("The `date` query parameter is required.");
  const options = await getRescheduleOptions(user, await paramId(params), date);
  return ok(options, { headers: { "Cache-Control": "no-store" } });
});

/** POST /api/v1/appointments/:id/reschedule { date, time } — move the appointment (transactional). */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const appointment = await rescheduleAppointmentForUser(user, await paramId(params), body);
  return ok(appointment);
});

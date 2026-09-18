import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { ApiError } from "@/server/http/errors";
import { requireUser } from "@/server/auth/currentUser";
import { isUuid } from "@/lib/validation/common";
import { cancelAppointmentForUser, getAppointmentForUser, updateAppointmentForUser } from "@/server/services/appointmentService";

export const dynamic = "force-dynamic";

async function paramId(params) {
  const { id } = await params;
  if (!isUuid(id)) throw ApiError.badRequest("Appointment identifier is not valid.");
  return id;
}

/** GET /api/v1/appointments/:id — dashboard detail (scoped). */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const appointment = await getAppointmentForUser(user, await paramId(params));
  return ok(appointment, { headers: { "Cache-Control": "no-store" } });
});

/** PATCH /api/v1/appointments/:id — update status / notes (scoped, validated transitions). */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const appointment = await updateAppointmentForUser(user, await paramId(params), body);
  return ok(appointment);
});

/** DELETE /api/v1/appointments/:id — cancel (records are never hard-deleted). */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { searchParams } = new URL(request.url);
  const reason = (searchParams.get("reason") || "").slice(0, 300) || null;
  const appointment = await cancelAppointmentForUser(user, await paramId(params), reason);
  return ok(appointment);
});

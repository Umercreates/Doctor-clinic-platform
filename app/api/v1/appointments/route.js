import { created, ok, readJson, readPagination, withErrorHandling } from "@/server/http/response";
import { ApiError } from "@/server/http/errors";
import { requireScopedPermission } from "@/server/auth/currentUser";
import { validateAppointmentFilters } from "@/lib/validation/appointmentAdmin";
import { bookAppointment, listAppointmentsForUser } from "@/server/services/appointmentService";
import { enforceIpRateLimit, enforceRateLimit } from "@/server/security/rateLimit";
import { normalizeString } from "@/lib/validation/common";

export const dynamic = "force-dynamic";

/** GET /api/v1/appointments — dashboard list (scoped by role). Filters: status, date, from, to, doctorId, patientId, search. */
export const GET = withErrorHandling(async (request) => {
  const { scope } = await requireScopedPermission(request, "appointments:read");
  const { searchParams } = new URL(request.url);
  const filters = validateAppointmentFilters(searchParams);
  if (!filters.valid) throw ApiError.validation(filters.errors);
  const { limit, offset, page } = readPagination(searchParams);
  const result = await listAppointmentsForUser(scope, { ...filters.value, limit, offset });
  return ok(result.items, { meta: { total: result.total, page, limit }, headers: { "Cache-Control": "no-store" } });
});

/** POST /api/v1/appointments — public booking from the website wizard (rate limited per IP and per email). */
export const POST = withErrorHandling(async (request) => {
  const limitMessage = "Too many booking attempts. Please wait a little while or call the clinic to book.";
  await enforceIpRateLimit(request, "booking:ip", { message: limitMessage });
  const body = await readJson(request);
  const email = normalizeString(body?.patient?.email).toLowerCase();
  if (email) await enforceRateLimit("booking:email", email, { message: limitMessage });
  const appointment = await bookAppointment(body);
  return created(appointment);
});

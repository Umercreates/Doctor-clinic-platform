import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listServicesForDoctor } from "@/server/repositories/servicesRepository";
import { deactivateDoctor, getDoctorOrThrow, updateDoctor } from "@/server/services/catalogService";

/** GET /api/v1/doctors/:id — public; `id` may be a UUID or a slug. */
export const GET = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const doctor = await getDoctorOrThrow(id);
  const services = await listServicesForDoctor(doctor.id);
  return ok({ ...doctor, services });
});

async function update(request, { params }) {
  await requirePermission(request, "doctors:write");
  const { id } = await params;
  const body = await readJson(request);
  const doctor = await updateDoctor(id, body);
  return ok(doctor);
}

/** PATCH / PUT /api/v1/doctors/:id — admin: update profile fields, services, care areas. */
export const PATCH = withErrorHandling(update);
export const PUT = withErrorHandling(update);

/** DELETE /api/v1/doctors/:id — admin: deactivate (soft delete). */
export const DELETE = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "doctors:write");
  const { id } = await params;
  const doctor = await deactivateDoctor(id);
  return ok(doctor);
});

import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listDoctorsByService } from "@/server/repositories/doctorsRepository";
import { deactivateService, getServiceOrThrow, updateService } from "@/server/services/catalogService";
import { revalidateServices } from "@/server/revalidation";

/** GET /api/v1/services/:id — public; `id` may be a UUID or a slug. */
export const GET = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const service = await getServiceOrThrow(id);
  const doctors = await listDoctorsByService(service.id);
  return ok({ ...service, doctors });
});

async function update(request, { params }) {
  await requirePermission(request, "services:write");
  const { id } = await params;
  const body = await readJson(request);
  const service = await updateService(id, body);
  revalidateServices([service.slug]);
  return ok(service);
}

export const PATCH = withErrorHandling(update);
export const PUT = withErrorHandling(update);

/** DELETE /api/v1/services/:id — admin: deactivate (soft delete). */
export const DELETE = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "services:write");
  const { id } = await params;
  const service = await deactivateService(id);
  revalidateServices([service.slug]);
  return ok(service);
});

import { created, ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listServices } from "@/server/repositories/servicesRepository";
import { createService } from "@/server/services/catalogService";
import { revalidateServices } from "@/server/revalidation";

/** GET /api/v1/services — public list of active services. */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  let includeInactive = false;
  if (searchParams.get("includeInactive") === "1") {
    await requirePermission(request, "services:write");
    includeInactive = true;
  }
  const services = await listServices({ includeInactive });
  return ok(services, { meta: { total: services.length } });
});

/** POST /api/v1/services — admin: create a service. */
export const POST = withErrorHandling(async (request) => {
  await requirePermission(request, "services:write");
  const body = await readJson(request);
  const service = await createService(body);
  revalidateServices([service.slug]);
  return created(service);
});

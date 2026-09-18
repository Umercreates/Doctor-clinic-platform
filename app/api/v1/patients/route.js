import { ok, readPagination, withErrorHandling } from "@/server/http/response";
import { requireScopedPermission } from "@/server/auth/currentUser";
import { listPatientsForScope } from "@/server/services/patientService";

export const dynamic = "force-dynamic";

/** GET /api/v1/patients?search=&page=&limit= — staff/admin: all; doctor: own patients only. */
export const GET = withErrorHandling(async (request) => {
  const { scope } = await requireScopedPermission(request, "patients:read");
  const { searchParams } = new URL(request.url);
  const { limit, offset, page } = readPagination(searchParams);
  const search = (searchParams.get("search") || "").trim().slice(0, 100);
  const result = await listPatientsForScope(scope, { search, limit, offset });
  return ok(result.items, { meta: { total: result.total, page, limit }, headers: { "Cache-Control": "no-store" } });
});

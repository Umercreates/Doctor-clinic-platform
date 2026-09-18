import { ok, withErrorHandling } from "@/server/http/response";
import { requireScopedPermission } from "@/server/auth/currentUser";
import { getPatientForScope } from "@/server/services/patientService";

export const dynamic = "force-dynamic";

/** GET /api/v1/patients/:id — patient contact details + appointment history (scoped). */
export const GET = withErrorHandling(async (request, { params }) => {
  const { scope } = await requireScopedPermission(request, "patients:read");
  const { id } = await params;
  const patient = await getPatientForScope(scope, id);
  return ok(patient, { headers: { "Cache-Control": "no-store" } });
});

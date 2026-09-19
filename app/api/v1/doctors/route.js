import { created, ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { createDoctor } from "@/server/services/catalogService";
import { revalidateDoctors } from "@/server/revalidation";

/** GET /api/v1/doctors — public list of active doctors (admins may pass ?includeInactive=1). */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  let includeInactive = false;
  if (searchParams.get("includeInactive") === "1") {
    await requirePermission(request, "doctors:write");
    includeInactive = true;
  }
  const doctors = await listDoctors({ includeInactive });
  return ok(doctors, { meta: { total: doctors.length } });
});

/** POST /api/v1/doctors — admin: create a doctor profile. */
export const POST = withErrorHandling(async (request) => {
  await requirePermission(request, "doctors:write");
  const body = await readJson(request);
  const doctor = await createDoctor(body);
  revalidateDoctors([doctor.slug]);
  return created(doctor);
});

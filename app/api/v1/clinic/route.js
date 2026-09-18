import { ok, withErrorHandling } from "@/server/http/response";
import { getClinic } from "@/server/repositories/clinicRepository";

export const GET = withErrorHandling(async () => {
  const clinic = await getClinic();
  return ok(clinic);
});

import { ok, withErrorHandling } from "@/server/http/response";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const GET = withErrorHandling(async () => {
  const doctors = await listDoctors();
  return ok(doctors, { meta: { total: doctors.length } });
});

import { ok, withErrorHandling } from "@/server/http/response";
import { listServices } from "@/server/repositories/servicesRepository";

export const GET = withErrorHandling(async () => {
  const services = await listServices();
  return ok(services, { meta: { total: services.length } });
});

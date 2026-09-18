import { ApiError } from "@/server/http/errors";
import { ok, withErrorHandling } from "@/server/http/response";
import { getServiceBySlug } from "@/server/repositories/servicesRepository";
import { listDoctorsByService } from "@/server/repositories/doctorsRepository";

export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) throw ApiError.notFound("Service not found.");
  const doctors = await listDoctorsByService(service.id);
  return ok({ ...service, doctors });
});

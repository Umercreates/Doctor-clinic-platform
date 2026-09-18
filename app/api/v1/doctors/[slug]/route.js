import { ApiError } from "@/server/http/errors";
import { ok, withErrorHandling } from "@/server/http/response";
import { getDoctorBySlug } from "@/server/repositories/doctorsRepository";
import { listServicesForDoctor } from "@/server/repositories/servicesRepository";

export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) throw ApiError.notFound("Doctor not found.");
  const services = await listServicesForDoctor(doctor.id);
  return ok({ ...doctor, services });
});

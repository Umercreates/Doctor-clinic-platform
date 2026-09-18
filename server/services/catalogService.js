/**
 * Admin use-cases for the public catalogue (doctors & services).
 * Route handlers authorize the caller before invoking these functions.
 */
import { ApiError } from "@/server/http/errors";
import { validateDoctorInput } from "@/lib/validation/doctor";
import { validateServiceInput } from "@/lib/validation/service";
import { isUuid } from "@/lib/validation/common";
import * as doctors from "@/server/repositories/doctorsRepository";
import * as services from "@/server/repositories/servicesRepository";

// ----- Doctors ---------------------------------------------------------------

export async function getDoctorOrThrow(idOrSlug, { includeInactive = false } = {}) {
  const doctor = await doctors.getDoctorByIdOrSlug(idOrSlug, { includeInactive });
  if (!doctor) throw ApiError.notFound("Doctor not found.");
  return doctor;
}

export async function createDoctor(input) {
  const validation = validateDoctorInput(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (validation.value.serviceIds) await assertServicesExist(validation.value.serviceIds);
  return doctors.createDoctor({ isActive: true, ...validation.value });
}

export async function updateDoctor(id, input) {
  if (!isUuid(id)) throw ApiError.badRequest("Doctor identifier is not valid.");
  const existing = await doctors.getDoctorById(id, { includeInactive: true });
  if (!existing) throw ApiError.notFound("Doctor not found.");
  const validation = validateDoctorInput(input, { partial: true });
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (!Object.keys(validation.value).length) throw ApiError.validation({ body: "Nothing to update." });
  if (validation.value.serviceIds) await assertServicesExist(validation.value.serviceIds);
  return doctors.updateDoctor(id, validation.value);
}

export async function deactivateDoctor(id) {
  if (!isUuid(id)) throw ApiError.badRequest("Doctor identifier is not valid.");
  const existing = await doctors.getDoctorById(id, { includeInactive: true });
  if (!existing) throw ApiError.notFound("Doctor not found.");
  return doctors.deactivateDoctor(id);
}

async function assertServicesExist(serviceIds) {
  for (const serviceId of serviceIds) {
    const service = await services.getServiceById(serviceId, { includeInactive: true });
    if (!service) throw ApiError.validation({ serviceIds: `Service ${serviceId} does not exist.` });
  }
}

// ----- Services --------------------------------------------------------------

export async function getServiceOrThrow(idOrSlug, { includeInactive = false } = {}) {
  const service = await services.getServiceByIdOrSlug(idOrSlug, { includeInactive });
  if (!service) throw ApiError.notFound("Service not found.");
  return service;
}

export async function createService(input) {
  const validation = validateServiceInput(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  return services.createService({ isActive: true, isDemo: false, ...validation.value });
}

export async function updateService(id, input) {
  if (!isUuid(id)) throw ApiError.badRequest("Service identifier is not valid.");
  const existing = await services.getServiceById(id, { includeInactive: true });
  if (!existing) throw ApiError.notFound("Service not found.");
  const validation = validateServiceInput(input, { partial: true });
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (!Object.keys(validation.value).length) throw ApiError.validation({ body: "Nothing to update." });
  return services.updateService(id, validation.value);
}

export async function deactivateService(id) {
  if (!isUuid(id)) throw ApiError.badRequest("Service identifier is not valid.");
  const existing = await services.getServiceById(id, { includeInactive: true });
  if (!existing) throw ApiError.notFound("Service not found.");
  return services.deactivateService(id);
}

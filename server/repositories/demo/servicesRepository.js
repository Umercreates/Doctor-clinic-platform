/**
 * Services repository — demo-data implementation.
 */
import { services } from "@/data/services";
import { notAvailable } from "./notAvailable";

function sortServices(list) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listServices({ includeInactive = false } = {}) {
  return sortServices(services.filter((s) => includeInactive || s.isActive));
}

export async function getServiceBySlug(slug) {
  return services.find((s) => s.slug === slug && s.isActive) || null;
}

export async function getServiceById(id) {
  return services.find((s) => s.id === id && s.isActive) || null;
}

export async function getServiceByIdOrSlug(idOrSlug) {
  return services.find((s) => (s.id === idOrSlug || s.slug === idOrSlug) && s.isActive) || null;
}

export async function listServicesForDoctor(doctorId) {
  return sortServices(services.filter((s) => s.isActive && s.doctorIds.includes(doctorId)));
}

export const createService = notAvailable;
export const updateService = notAvailable;
export const deactivateService = notAvailable;

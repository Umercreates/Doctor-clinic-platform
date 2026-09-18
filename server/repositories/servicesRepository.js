/**
 * Services repository (demo-data backed; swapped for PostgreSQL later).
 */
import { services } from "@/data/services";

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

export async function listServicesForDoctor(doctorId) {
  return sortServices(services.filter((s) => s.isActive && s.doctorIds.includes(doctorId)));
}

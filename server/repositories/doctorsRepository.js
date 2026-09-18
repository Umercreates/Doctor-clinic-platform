/**
 * Doctors repository.
 *
 * Currently backed by structured demo data. In the backend phase this module
 * keeps the same async interface but reads from PostgreSQL (see
 * `lib/database/schema.sql`), so callers never need to change.
 */
import { doctors } from "@/data/doctors";

function sortDoctors(list) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listDoctors({ includeInactive = false } = {}) {
  return sortDoctors(doctors.filter((d) => includeInactive || d.isActive));
}

export async function getDoctorBySlug(slug) {
  return doctors.find((d) => d.slug === slug && d.isActive) || null;
}

export async function getDoctorById(id) {
  return doctors.find((d) => d.id === id && d.isActive) || null;
}

export async function getLeadDoctor() {
  return doctors.find((d) => d.isLead) || doctors[0] || null;
}

export async function listDoctorsByService(serviceId) {
  return sortDoctors(doctors.filter((d) => d.isActive && d.serviceIds.includes(serviceId)));
}

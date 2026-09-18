/**
 * Doctors repository — demo-data implementation (used when DATABASE_URL is
 * not configured). Same interface as the PostgreSQL implementation.
 */
import { doctors } from "@/data/doctors";
import { notAvailable } from "./notAvailable";

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

export async function getDoctorByIdOrSlug(idOrSlug) {
  return doctors.find((d) => (d.id === idOrSlug || d.slug === idOrSlug) && d.isActive) || null;
}

export async function getLeadDoctor() {
  return doctors.find((d) => d.isLead) || doctors[0] || null;
}

export async function listDoctorsByService(serviceId) {
  return sortDoctors(doctors.filter((d) => d.isActive && d.serviceIds.includes(serviceId)));
}

export const createDoctor = notAvailable;
export const updateDoctor = notAvailable;
export const deactivateDoctor = notAvailable;

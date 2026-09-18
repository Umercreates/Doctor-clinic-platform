/**
 * Clinic settings repository (demo-data backed; swapped for PostgreSQL later).
 */
import { clinic } from "@/data/clinic";

export async function getClinic() {
  return clinic;
}

/**
 * Clinic settings repository — demo-data implementation.
 */
import { clinic } from "@/data/clinic";
import { notAvailable } from "./notAvailable";

export async function getClinic() {
  return clinic;
}

export async function getSetting() {
  return null;
}

export async function setSetting() {
  return notAvailable();
}

export async function listSettings() {
  return [];
}

/**
 * Clinic settings repository — PostgreSQL implementation.
 * Merges `website_settings` rows over the bundled defaults so a missing key
 * never breaks the site.
 */
import { queryRows, query } from "@/lib/database";
import { clinic as defaults } from "@/data/clinic";

export async function getClinic() {
  const rows = await queryRows("SELECT key, value FROM website_settings");
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const profile = settings.profile || {};
  return {
    ...defaults,
    ...profile,
    leadDoctorId: profile.leadDoctorSlug || defaults.leadDoctorId,
    address: settings.address || defaults.address,
    contact: settings.contact || defaults.contact,
    hours: settings.hours || defaults.hours,
    social: settings.social || defaults.social,
    emergencyNotice: settings.notices?.emergencyNotice || defaults.emergencyNotice,
    medicalDisclaimer: settings.notices?.medicalDisclaimer || defaults.medicalDisclaimer,
    booking: settings.booking || null,
  };
}

export async function getSetting(key) {
  const rows = await queryRows("SELECT value FROM website_settings WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

export async function setSetting(key, value, updatedBy = null) {
  await query(
    "INSERT INTO website_settings (key, value, updated_by) VALUES ($1, $2::jsonb, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by",
    [key, JSON.stringify(value), updatedBy],
  );
  return value;
}

export async function listSettings() {
  const rows = await queryRows("SELECT key, value, updated_at FROM website_settings ORDER BY key");
  return rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updated_at }));
}

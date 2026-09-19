/**
 * Website content & settings use-cases.
 *
 * Public pages read through `getClinicSettings()` / `getSiteContent()` /
 * `getBookingRules()`, which are wrapped in React `cache` so a layout and the
 * page it renders share one query per request. Admin writes validate the
 * payload against the declared schema before touching the database and are
 * followed by targeted cache revalidation in the route handler.
 */
import { cache } from "react";
import { clinic as defaultClinic } from "@/data/clinic";
import { contentBlockDefaults, contentSections, fillTokens } from "@/data/content";
import { CONTENT_BLOCK_KEYS, validateContentBlock } from "@/lib/validation/content";
import { SETTING_KEYS, validateSetting } from "@/lib/validation/settings";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { ApiError } from "@/server/http/errors";
import * as clinicRepo from "@/server/repositories/clinicRepository";
import * as contentRepo from "@/server/repositories/contentRepository";
import { getLeadDoctor, listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";
import { log } from "@/server/log";

// ----- Reads (public site) ---------------------------------------------------

/** Clinic profile, contact, address, hours, social and notices (defaults merged). */
export const getClinicSettings = cache(async () => {
  try {
    return await clinicRepo.getClinic();
  } catch (error) {
    // The public site must render even when the database is unreachable.
    log.error("content.settings_fallback", { error });
    return defaultClinic;
  }
});

/** Lead doctor (cached per request; used for copy tokens and the hero). */
export const getLeadDoctorCached = cache(async () => {
  try {
    return await getLeadDoctor();
  } catch (error) {
    log.error("content.lead_doctor_unavailable", { error });
    return null;
  }
});

/** Booking rules from settings, falling back to the bundled defaults. */
export const getBookingRules = cache(async () => {
  const clinic = await getClinicSettings();
  const stored = clinic.booking && typeof clinic.booking === "object" ? clinic.booking : {};
  return {
    ...APPOINTMENT_LIMITS,
    maxDaysAhead: stored.maxDaysAhead ?? APPOINTMENT_LIMITS.maxDaysAhead,
    minLeadMinutes: stored.minLeadMinutes ?? APPOINTMENT_LIMITS.minLeadMinutes,
    slotStepMinutes: stored.slotStepMinutes ?? APPOINTMENT_LIMITS.slotStepMinutes,
    defaultSlotMinutes: stored.defaultSlotMinutes ?? APPOINTMENT_LIMITS.defaultSlotMinutes,
    timeZone: stored.timeZone || clinic.hours?.timeZone || "America/Los_Angeles",
  };
});

/** Active doctors / services, deduplicated across the site layout and the page it renders. */
export const getPublicDoctors = cache(async () => listDoctors());
export const getPublicServices = cache(async () => listServices());

function tokensFor(clinic, leadDoctor) {
  return {
    clinic: clinic.name,
    city: clinic.city,
    state: clinic.stateFull || clinic.state,
    leadDoctor: leadDoctor?.name || "our doctors",
  };
}

/**
 * Every content block, merged over defaults with {tokens} filled in.
 * Shape: { "home.hero": {...}, "about.mission": {...}, ... }
 */
export const getSiteContent = cache(async () => {
  const [clinic, leadDoctor] = await Promise.all([getClinicSettings(), getLeadDoctorCached()]);
  let stored = [];
  try {
    stored = await contentRepo.listContentBlocks();
  } catch (error) {
    log.error("content.blocks_fallback", { error });
  }
  const byKey = Object.fromEntries(stored.map((b) => [b.key, b.value]));
  const tokens = tokensFor(clinic, leadDoctor);
  const content = {};
  for (const key of CONTENT_BLOCK_KEYS) {
    const merged = { ...contentBlockDefaults[key], ...(byKey[key] || {}) };
    content[key] = fillTokens(merged, tokens);
  }
  return content;
});

/** One block, defaults merged and tokens filled. */
export async function getContentBlock(key) {
  const content = await getSiteContent();
  return content[key] || null;
}

// ----- Admin ----------------------------------------------------------------

/** Editor view: sections with each block's raw (token-preserving) value. */
export async function listContentForAdmin() {
  const stored = await contentRepo.listContentBlocks();
  const byKey = Object.fromEntries(stored.map((b) => [b.key, b]));
  return contentSections.map((section) => ({
    id: section.id,
    label: section.label,
    blocks: section.blocks.map((block) => ({
      key: block.key,
      label: block.label,
      fields: block.fields,
      value: { ...contentBlockDefaults[block.key], ...(byKey[block.key]?.value || {}) },
      isCustomized: Boolean(byKey[block.key]),
      updatedAt: byKey[block.key]?.updatedAt || null,
    })),
  }));
}

export async function updateContentBlock(key, input, userId = null) {
  if (!CONTENT_BLOCK_KEYS.includes(key)) throw ApiError.notFound("Unknown content block.");
  const validation = validateContentBlock(key, input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  return contentRepo.setContentBlock(key, validation.value, userId);
}

/** Restore a block to its bundled default. */
export async function resetContentBlock(key) {
  if (!CONTENT_BLOCK_KEYS.includes(key)) throw ApiError.notFound("Unknown content block.");
  await contentRepo.deleteContentBlock(key);
  return { key, value: contentBlockDefaults[key], isCustomized: false };
}

/** Settings editor view: current value per editable key (defaults merged). */
export async function listSettingsForAdmin() {
  const [clinic, rows] = await Promise.all([clinicRepo.getClinic(), clinicRepo.listSettings()]);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r]));
  const current = {
    profile: {
      name: clinic.name,
      shortName: clinic.shortName,
      descriptor: clinic.descriptor,
      tagline: clinic.tagline,
      description: clinic.description,
      city: clinic.city,
      state: clinic.state,
      stateFull: clinic.stateFull,
      country: clinic.country,
      region: clinic.region || "",
      leadDoctorSlug: clinic.leadDoctorId || "",
    },
    contact: clinic.contact,
    address: clinic.address,
    hours: clinic.hours,
    social: clinic.social,
    notices: { emergencyNotice: clinic.emergencyNotice, medicalDisclaimer: clinic.medicalDisclaimer },
    booking: await getBookingRules(),
  };
  return SETTING_KEYS.map((key) => ({
    key,
    value: current[key],
    isCustomized: Boolean(stored[key]),
    updatedAt: stored[key]?.updatedAt || null,
  }));
}

export async function updateSetting(key, input, userId = null) {
  if (!SETTING_KEYS.includes(key)) throw ApiError.notFound("Unknown setting.");
  const validation = validateSetting(key, input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  await clinicRepo.setSetting(key, validation.value, userId);
  return { key, value: validation.value, isCustomized: true };
}

import { isTimeString, timeToMinutes } from "@/lib/dates";
import { email as validateEmail, integer, maxLength, normalizeString, phone as validatePhone, required } from "./common";

/** Setting keys the dashboard may edit. Anything else is rejected. */
export const SETTING_KEYS = ["profile", "contact", "address", "hours", "social", "notices", "booking"];

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SOCIAL_IDS = ["facebook", "instagram", "linkedin"];

function text(errors, value, name, label, { max = 200, optional = false } = {}) {
  const v = normalizeString(value);
  if (!v) {
    if (!optional) errors[name] = `${label} is required.`;
    return optional ? "" : undefined;
  }
  const e = maxLength(v, max, label);
  if (e) errors[name] = e;
  return v;
}

export function validateProfile(input = {}) {
  const errors = {};
  const value = {
    name: text(errors, input.name, "name", "Clinic name", { max: 60 }),
    shortName: text(errors, input.shortName, "shortName", "Short name", { max: 40 }),
    descriptor: text(errors, input.descriptor, "descriptor", "Descriptor", { max: 40 }),
    tagline: text(errors, input.tagline, "tagline", "Tagline", { max: 120 }),
    description: text(errors, input.description, "description", "Description", { max: 400 }),
    city: text(errors, input.city, "city", "City", { max: 60 }),
    state: text(errors, input.state, "state", "State code", { max: 5 }),
    stateFull: text(errors, input.stateFull, "stateFull", "State", { max: 40 }),
    country: text(errors, input.country, "country", "Country", { max: 40 }),
    region: text(errors, input.region, "region", "Region", { max: 60, optional: true }),
    leadDoctorSlug: text(errors, input.leadDoctorSlug, "leadDoctorSlug", "Lead doctor", { max: 80, optional: true }),
  };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateContact(input = {}) {
  const errors = {};
  const phoneValue = normalizeString(input.phone);
  const phoneError = validatePhone(phoneValue);
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  const fax = normalizeString(input.fax);
  if (fax && validatePhone(fax)) errors.fax = "Please enter a valid fax number.";
  const digits = phoneValue.replace(/\D/g, "");
  const value = {
    isDemo: input.isDemo === true,
    phone: phoneValue,
    phoneHref: `tel:${digits.length === 10 ? `+1${digits}` : `+${digits}`}`,
    email: normalizeString(input.email).toLowerCase(),
    fax: fax || "",
  };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateAddress(input = {}) {
  const errors = {};
  const value = {
    isDemo: input.isDemo === true,
    line1: text(errors, input.line1, "line1", "Address line 1", { max: 120 }),
    line2: text(errors, input.line2, "line2", "Address line 2", { max: 120, optional: true }),
    city: text(errors, input.city, "city", "City", { max: 60 }),
    state: text(errors, input.state, "state", "State", { max: 5 }),
    postalCode: text(errors, input.postalCode, "postalCode", "Postal code", { max: 12 }),
    country: text(errors, input.country, "country", "Country", { max: 40 }),
    mapQuery: text(errors, input.mapQuery, "mapQuery", "Map search text", { max: 160 }),
  };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateHours(input = {}) {
  const errors = {};
  const schedule = Array.isArray(input.schedule) ? input.schedule : [];
  if (schedule.length !== 7) {
    return { valid: false, errors: { schedule: "Provide all seven days." }, value: null };
  }
  const days = [];
  const seen = new Set();
  for (const entry of schedule) {
    const day = Number(entry?.day);
    if (!Number.isInteger(day) || day < 0 || day > 6 || seen.has(day)) {
      errors.schedule = "Each weekday must appear exactly once.";
      break;
    }
    seen.add(day);
    const closed = entry.closed === true || (!entry.open && !entry.close);
    if (closed) {
      days.push({ day, label: DAY_LABELS[day], open: null, close: null });
      continue;
    }
    if (!isTimeString(entry.open) || !isTimeString(entry.close)) {
      errors[`day${day}`] = `${DAY_LABELS[day]}: times must be HH:MM.`;
      continue;
    }
    if (timeToMinutes(entry.close) <= timeToMinutes(entry.open)) {
      errors[`day${day}`] = `${DAY_LABELS[day]}: closing time must be after opening time.`;
      continue;
    }
    days.push({ day, label: DAY_LABELS[day], open: entry.open, close: entry.close });
  }
  days.sort((a, b) => a.day - b.day);
  const tz = normalizeString(input.timeZone) || "America/Los_Angeles";
  if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(tz)) errors.timeZone = "Time zone must look like Area/City.";
  const value = { isDemo: input.isDemo === true, timeZone: tz, schedule: days };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateSocial(input = {}) {
  const errors = {};
  const links = [];
  for (const id of SOCIAL_IDS) {
    const raw = Array.isArray(input.links) ? input.links.find((l) => l?.id === id) : input[id] !== undefined ? { id, href: input[id] } : null;
    const href = normalizeString(raw?.href);
    if (href && href !== "#" && !/^https:\/\/[^\s]+$/i.test(href)) errors[id] = "Enter a full https:// link or leave it blank.";
    links.push({ id, label: id[0].toUpperCase() + id.slice(1), href: href || "#" });
  }
  const value = { isDemo: input.isDemo === true, links };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateNotices(input = {}) {
  const errors = {};
  const value = {
    emergencyNotice: text(errors, input.emergencyNotice, "emergencyNotice", "Emergency notice", { max: 400 }),
    medicalDisclaimer: text(errors, input.medicalDisclaimer, "medicalDisclaimer", "Medical disclaimer", { max: 600 }),
  };
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateBooking(input = {}) {
  const errors = {};
  const value = {};
  const rules = [
    ["maxDaysAhead", "Booking window (days)", 1, 365],
    ["minLeadMinutes", "Same-day lead time (minutes)", 0, 1440],
    ["slotStepMinutes", "Slot grid (minutes)", 5, 120],
    ["defaultSlotMinutes", "Default slot length (minutes)", 5, 240],
  ];
  for (const [name, label, min, max] of rules) {
    const e = integer(input[name], { min, max, label });
    if (e) errors[name] = e;
    else value[name] = Number(input[name]);
  }
  value.timeZone = normalizeString(input.timeZone) || "America/Los_Angeles";
  const r = required(value.timeZone, "Time zone");
  if (r) errors.timeZone = r;
  return { valid: Object.keys(errors).length === 0, errors, value };
}

const VALIDATORS = {
  profile: validateProfile,
  contact: validateContact,
  address: validateAddress,
  hours: validateHours,
  social: validateSocial,
  notices: validateNotices,
  booking: validateBooking,
};

export function validateSetting(key, input) {
  const validator = VALIDATORS[key];
  if (!validator) return { valid: false, errors: { key: "Unknown setting." }, value: null };
  return validator(input || {});
}

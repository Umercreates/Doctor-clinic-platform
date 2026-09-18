/**
 * Small, dependency-free validation helpers shared by client forms and the
 * API layer. Each validator returns `null` when valid or an error message.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Accepts common US and international formats: digits, spaces, dashes, dots, parentheses, leading +
const PHONE_RE = /^\+?[0-9 ().-]{7,20}$/;

export function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function required(value, label = "This field") {
  return normalizeString(value) ? null : `${label} is required.`;
}

export function minLength(value, min, label = "This field") {
  return normalizeString(value).length >= min ? null : `${label} must be at least ${min} characters.`;
}

export function maxLength(value, max, label = "This field") {
  return normalizeString(value).length <= max ? null : `${label} must be ${max} characters or fewer.`;
}

export function email(value) {
  const v = normalizeString(value);
  if (!v) return "Email address is required.";
  return EMAIL_RE.test(v) ? null : "Please enter a valid email address.";
}

export function phone(value) {
  const v = normalizeString(value);
  if (!v) return "Phone number is required.";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number.";
  return PHONE_RE.test(v) ? null : "Please enter a valid phone number.";
}

/** Run a set of validators; returns the first error or null. */
export function firstError(...results) {
  return results.find((r) => r) || null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function uuid(value, label = "Identifier") {
  return isUuid(value) ? null : `${label} is not valid.`;
}

export function slug(value, label = "Slug") {
  const v = normalizeString(value);
  if (!v) return `${label} is required.`;
  return SLUG_RE.test(v) && v.length <= 80 ? null : `${label} may only contain lowercase letters, numbers and hyphens.`;
}

export function integer(value, { min = 0, max = Number.MAX_SAFE_INTEGER, label = "Value" } = {}) {
  if (value === null || value === undefined || value === "") return `${label} is required.`;
  const n = Number(value);
  if (!Number.isInteger(n)) return `${label} must be a whole number.`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

export function oneOf(value, allowed, label = "Value") {
  return allowed.includes(value) ? null : `${label} must be one of: ${allowed.join(", ")}.`;
}

export function boolean(value, label = "Value") {
  return typeof value === "boolean" ? null : `${label} must be true or false.`;
}

export function stringArray(value, { maxItems = 50, maxLength = 500, label = "List" } = {}) {
  if (!Array.isArray(value)) return `${label} must be a list.`;
  if (value.length > maxItems) return `${label} may contain at most ${maxItems} items.`;
  if (value.some((v) => typeof v !== "string" || v.length > maxLength)) return `${label} contains an invalid entry.`;
  return null;
}

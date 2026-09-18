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

import { boolean, firstError, integer, isUuid, maxLength, minLength, normalizeString, required } from "./common";

/**
 * Testimonials are only ever shown publicly when `isPublished` AND
 * `consentGiven` are both true. Nothing here fabricates a review: the
 * dashboard requires an explicit consent flag set by staff.
 */
export function validateTestimonialInput(input = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (k) => input[k] !== undefined;
  const need = (k) => !partial || has(k);

  if (need("authorName")) {
    const n = normalizeString(input.authorName);
    const e = firstError(required(n, "Name"), minLength(n, 2, "Name"), maxLength(n, 80, "Name"));
    if (e) errors.authorName = e;
    else value.authorName = n;
  }
  if (need("quote")) {
    const q = normalizeString(input.quote);
    const e = firstError(required(q, "Quote"), minLength(q, 10, "Quote"), maxLength(q, 600, "Quote"));
    if (e) errors.quote = e;
    else value.quote = q;
  }
  if (has("doctorId")) {
    if (input.doctorId === null || input.doctorId === "") value.doctorId = null;
    else if (!isUuid(input.doctorId)) errors.doctorId = "Doctor identifier is not valid.";
    else value.doctorId = input.doctorId;
  }
  if (has("rating")) {
    if (input.rating === null || input.rating === "") value.rating = null;
    else {
      const e = integer(input.rating, { min: 1, max: 5, label: "Rating" });
      if (e) errors.rating = e;
      else value.rating = Number(input.rating);
    }
  }
  for (const flag of ["isPublished", "consentGiven"]) {
    if (has(flag)) {
      const e = boolean(input[flag], flag);
      if (e) errors[flag] = e;
      else value[flag] = input[flag];
    }
  }
  if (has("sortOrder")) {
    const e = integer(input.sortOrder, { min: 0, max: 10000, label: "Sort order" });
    if (e) errors.sortOrder = e;
    else value.sortOrder = Number(input.sortOrder);
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}

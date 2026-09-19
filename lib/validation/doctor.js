import { boolean, firstError, integer, maxLength, minLength, normalizeString, required, slug, stringArray, isUuid } from "./common";

/**
 * Validate doctor create/update input. On update (`partial: true`) only the
 * supplied fields are validated. Never accepts credentials or clinical claims.
 */
export function validateDoctorInput(input = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (key) => input[key] !== undefined;
  const need = (key) => !partial || has(key);

  if (need("name")) {
    const name = normalizeString(input.name);
    const e = firstError(required(name, "Name"), minLength(name, 2, "Name"), maxLength(name, 100, "Name"));
    if (e) errors.name = e;
    else value.name = name;
  }
  if (need("slug")) {
    const s = normalizeString(input.slug).toLowerCase();
    const e = slug(s);
    if (e) errors.slug = e;
    else value.slug = s;
  }
  if (has("title")) value.title = normalizeString(input.title).slice(0, 100) || null;
  if (has("role")) {
    const role = normalizeString(input.role);
    const e = firstError(required(role, "Role"), maxLength(role, 100, "Role"));
    if (e) errors.role = e;
    else value.role = role;
  }
  if (has("location")) value.location = normalizeString(input.location).slice(0, 150) || null;
  if (has("photoUrl")) {
    const url = normalizeString(input.photoUrl);
    // Only files served from this site (no remote image hosts are configured for next/image).
    if (url && !/^\/(?!\/)[\w\-./%]+\.(png|jpe?g|webp|avif|svg)$/i.test(url)) errors.photoUrl = "Photo must be a path under /images/, e.g. /images/doctors/name.png.";
    else value.photoUrl = url || null;
  }
  if (has("photoAlt")) value.photoAlt = normalizeString(input.photoAlt).slice(0, 200) || null;
  if (has("photoPosition")) value.photoPosition = normalizeString(input.photoPosition).slice(0, 30) || null;
  if (has("shortBio")) {
    const e = maxLength(input.shortBio, 300, "Short bio");
    if (e) errors.shortBio = e;
    else value.shortBio = normalizeString(input.shortBio) || null;
  }
  if (has("bio")) {
    const e = stringArray(input.bio, { maxItems: 10, maxLength: 2000, label: "Biography" });
    if (e) errors.bio = e;
    else value.bio = input.bio.map((p) => p.trim()).filter(Boolean);
  }
  if (has("languages")) {
    const e = stringArray(input.languages, { maxItems: 10, maxLength: 40, label: "Languages" });
    if (e) errors.languages = e;
    else value.languages = input.languages.map((l) => l.trim()).filter(Boolean);
  }
  if (has("careAreas")) {
    const e = stringArray(input.careAreas, { maxItems: 20, maxLength: 120, label: "Areas of care" });
    if (e) errors.careAreas = e;
    else value.careAreas = [...new Set(input.careAreas.map((a) => a.trim()).filter(Boolean))];
  }
  if (has("serviceIds")) {
    if (!Array.isArray(input.serviceIds) || input.serviceIds.some((id) => !isUuid(id))) errors.serviceIds = "Service identifiers are not valid.";
    else value.serviceIds = [...new Set(input.serviceIds)];
  }
  for (const flag of ["roleIsDemo", "bioIsDemo", "isLead", "acceptingNewPatients", "isActive"]) {
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

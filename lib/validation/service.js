import { boolean, firstError, integer, isUuid, maxLength, minLength, normalizeString, required, slug, stringArray } from "./common";

export function validateServiceInput(input = {}, { partial = false } = {}) {
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
  if (need("durationMinutes")) {
    const e = integer(input.durationMinutes, { min: 5, max: 480, label: "Duration" });
    if (e) errors.durationMinutes = e;
    else value.durationMinutes = Number(input.durationMinutes);
  }
  if (has("priceCents")) {
    if (input.priceCents === null) value.priceCents = null;
    else {
      const e = integer(input.priceCents, { min: 0, max: 100_000_000, label: "Price" });
      if (e) errors.priceCents = e;
      else value.priceCents = Number(input.priceCents);
    }
  }
  if (has("icon")) value.icon = normalizeString(input.icon).slice(0, 40) || null;
  if (has("shortDescription")) {
    const e = maxLength(input.shortDescription, 300, "Short description");
    if (e) errors.shortDescription = e;
    else value.shortDescription = normalizeString(input.shortDescription) || null;
  }
  if (has("description")) {
    const e = stringArray(input.description, { maxItems: 10, maxLength: 2000, label: "Description" });
    if (e) errors.description = e;
    else value.description = input.description.map((p) => p.trim()).filter(Boolean);
  }
  if (has("highlights")) {
    const e = stringArray(input.highlights, { maxItems: 12, maxLength: 160, label: "Highlights" });
    if (e) errors.highlights = e;
    else value.highlights = input.highlights.map((p) => p.trim()).filter(Boolean);
  }
  if (has("doctorIds")) {
    if (!Array.isArray(input.doctorIds) || input.doctorIds.some((id) => !isUuid(id))) errors.doctorIds = "Doctor identifiers are not valid.";
    else value.doctorIds = [...new Set(input.doctorIds)];
  }
  for (const flag of ["isDemo", "isActive"]) {
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

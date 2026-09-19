import { boolean, firstError, integer, maxLength, minLength, normalizeString, required, slug } from "./common";

export const FAQ_CATEGORIES = ["appointments", "visits", "clinic", "general"];

export function validateFaqInput(input = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (k) => input[k] !== undefined;
  const need = (k) => !partial || has(k);

  if (need("key")) {
    const k = normalizeString(input.key).toLowerCase();
    const e = slug(k, "Key");
    if (e) errors.key = e;
    else value.key = k;
  }
  if (need("question")) {
    const q = normalizeString(input.question);
    const e = firstError(required(q, "Question"), minLength(q, 5, "Question"), maxLength(q, 200, "Question"));
    if (e) errors.question = e;
    else value.question = q;
  }
  if (need("answer")) {
    const a = normalizeString(input.answer);
    const e = firstError(required(a, "Answer"), minLength(a, 10, "Answer"), maxLength(a, 2000, "Answer"));
    if (e) errors.answer = e;
    else value.answer = a;
  }
  if (has("category")) {
    const c = normalizeString(input.category).toLowerCase() || "general";
    if (!FAQ_CATEGORIES.includes(c)) errors.category = `Category must be one of: ${FAQ_CATEGORIES.join(", ")}.`;
    else value.category = c;
  }
  for (const flag of ["featured", "isActive"]) {
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

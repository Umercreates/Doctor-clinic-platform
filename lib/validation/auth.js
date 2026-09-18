import { email, normalizeString } from "./common";

export const LOGIN_PASSWORD_MAX = 128;

/** Validate a login request. Never reveals which field failed beyond format. */
export function validateLogin(input = {}) {
  const errors = {};
  const emailError = email(input.email);
  if (emailError) errors.email = emailError;

  const password = typeof input.password === "string" ? input.password : "";
  if (!password) errors.password = "Password is required.";
  else if (password.length > LOGIN_PASSWORD_MAX) errors.password = "Password is too long.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      email: normalizeString(input.email).toLowerCase(),
      password,
      remember: input.remember === true || input.remember === "true" || input.remember === "on",
    },
  };
}

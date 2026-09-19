/**
 * Authentication use-cases on top of Supabase Auth.
 *
 * Supabase verifies passwords and issues the session; this service maps the
 * authenticated identity to the application's `users` row (role, doctor link)
 * and refuses sign-in for identities that have no dashboard access.
 * Nothing here ever returns tokens, secrets, or password material.
 */
import { ApiError } from "@/server/http/errors";
import { validateLogin } from "@/lib/validation/auth";
import { clearRateLimit, enforceRateLimit } from "@/server/security/rateLimit";
import { log, maskEmail } from "@/server/log";
import { resolveAppUser } from "@/server/auth/currentUser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isDatabaseConfigured } from "@/lib/database";
import * as users from "@/server/repositories/usersRepository";

const INVALID_CREDENTIALS = "The email address or password is incorrect.";

/** Public representation of a user: id, name, email, role, doctorId. */
export function toPublicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, doctorId: user.doctorId || null };
}

export function assertAuthConfigured() {
  if (!isSupabaseConfigured()) {
    throw ApiError.serviceUnavailable("Sign-in is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  if (!isDatabaseConfigured()) {
    throw ApiError.serviceUnavailable("Sign-in requires the database. Configure DATABASE_URL to enable staff accounts.");
  }
}

/**
 * @param {object} input        { email, password, remember? }
 * @param {object} context      { supabase: route-bound Supabase client, ipAddress }
 */
export async function login(input, { supabase, ipAddress } = {}) {
  assertAuthConfigured();
  const validation = validateLogin(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  const { email, password } = validation.value;

  // Two limits: per IP across accounts, and per IP + account (credential stuffing).
  const ip = ipAddress || "unknown";
  await enforceRateLimit("login:ip", ip);
  const identityKey = `${ip}:${email}`;
  await enforceRateLimit("login:identity", identityKey);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    const status = error?.status;
    log.warn("auth.login_failed", { email: maskEmail(email), ip, reason: error?.code || status || "unknown" });
    if (error?.code === "email_not_confirmed") {
      throw ApiError.forbidden("This email address has not been confirmed yet.");
    }
    if (status === 429 || error?.code === "over_request_rate_limit") throw ApiError.tooManyRequests();
    if (status && status >= 500) throw ApiError.serviceUnavailable("The sign-in service is temporarily unavailable. Please try again.");
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  const appUser = await resolveAppUser(data.user);
  if (!appUser) {
    // Valid Supabase identity but no dashboard role: end the session immediately.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    log.warn("auth.login_no_access", { email: maskEmail(email), ip });
    throw ApiError.forbidden("This account does not have access to the staff dashboard.");
  }

  users.updateLastLogin(appUser.id).catch(() => {});
  await clearRateLimit("login:identity", identityKey);
  log.info("auth.login", { role: appUser.role, userId: appUser.id, ip });
  return { user: toPublicUser(appUser), expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000) : null };
}

/** Signs out the current session (revokes the refresh token) and clears cookies. */
export async function logout({ supabase } = {}) {
  if (supabase) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error && error.status !== 401 && error.status !== 403) {
      log.warn("auth.logout_warning", { reason: error.message });
    }
  }
  return { signedOut: true };
}

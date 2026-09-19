/**
 * Resolve the signed-in application user.
 *
 * Identity comes from Supabase Auth (verified server-side with `getUser()`,
 * which validates the token against Supabase rather than trusting the cookie).
 * The application role comes from the `users` table, matched by
 * `auth_user_id` (or linked by email on first sign-in after seeding).
 */
import { ApiError } from "@/server/http/errors";
import { createSupabaseRequestClient, createSupabaseServerClient } from "@/lib/supabase/server";
import * as users from "@/server/repositories/usersRepository";
import { can, resolveScope } from "./permissions";
import { log } from "@/server/log";

/** Map a Supabase auth user to the application user (with role), or null. */
export async function resolveAppUser(authUser) {
  if (!authUser?.id) return null;
  let appUser = await users.findUserByAuthId(authUser.id);
  if (!appUser && authUser.email) {
    // First sign-in for a user seeded by email only: link the auth identity.
    const byEmail = await users.findUserByEmail(authUser.email);
    if (byEmail && !byEmail.authUserId) appUser = await users.linkAuthUser(byEmail.id, authUser.id);
  }
  if (!appUser || !appUser.isActive) return null;
  return appUser;
}

async function userFromClient(supabase) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return resolveAppUser(data.user);
  } catch (error) {
    log.error("auth.resolve_failed", { error });
    return null;
  }
}

/** Server components / layouts: application user or null. */
export async function getCurrentUser() {
  return userFromClient(await createSupabaseServerClient());
}

/** Route handlers: application user or null. */
export async function getRequestUser(request) {
  return userFromClient(createSupabaseRequestClient(request));
}

/** Route handlers: user or 401. */
export async function requireUser(request) {
  const user = await getRequestUser(request);
  if (!user) throw ApiError.unauthorized();
  return user;
}

/** Route handlers: user with the permission, or 401/403. */
export async function requirePermission(request, permission) {
  const user = await requireUser(request);
  if (!can(user, permission)) throw ApiError.forbidden();
  return user;
}

/**
 * Route handlers: user plus the scope for a permission that supports ":own".
 * Returns { user, scope } where scope is { all: true } or { doctorId }.
 */
export async function requireScopedPermission(request, permission) {
  const user = await requireUser(request);
  const scope = resolveScope(user, permission);
  if (!scope) throw ApiError.forbidden();
  return { user, scope };
}

/** Best-effort client IP for rate limiting (behind a proxy use X-Forwarded-For). */
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  return request.headers.get("x-real-ip")?.slice(0, 64) || null;
}

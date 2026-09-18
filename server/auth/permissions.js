/**
 * Role-based authorization.
 *
 * Roles: admin (everything), doctor (their own appointments, patients,
 * availability and profile), staff (front-desk: appointments & patients).
 * Permissions are strings; a trailing ":own" means the action is limited to
 * records linked to the user's own doctor profile.
 */
export const ROLES = Object.freeze({ ADMIN: "admin", DOCTOR: "doctor", STAFF: "staff" });
export const ALL_ROLES = Object.values(ROLES);

const ROLE_PERMISSIONS = {
  admin: ["*"],
  staff: [
    "appointments:read", "appointments:write",
    "patients:read", "patients:write",
    "doctors:read", "services:read",
    "availability:read",
  ],
  doctor: [
    "appointments:read:own", "appointments:write:own",
    "patients:read:own",
    "availability:read:own", "availability:write:own",
    "doctors:read", "services:read",
    "profile:write:own",
  ],
};

/** True when the user holds the permission (or its ":own" variant when scoped). */
export function can(user, permission) {
  if (!user) return false;
  const granted = ROLE_PERMISSIONS[user.role] || [];
  return granted.includes("*") || granted.includes(permission);
}

/**
 * Resolve how a list/read should be scoped for the user:
 *   { all: true }            full access
 *   { doctorId }             restricted to the user's own doctor profile
 *   null                     no access
 */
export function resolveScope(user, permission) {
  if (can(user, permission)) return { all: true };
  if (can(user, `${permission}:own`) && user.doctorId) return { doctorId: user.doctorId };
  return null;
}

/** True when the user may act on a record belonging to `doctorId`. */
export function canAccessDoctorRecord(user, permission, doctorId) {
  const scope = resolveScope(user, permission);
  if (!scope) return false;
  if (scope.all) return true;
  return scope.doctorId === doctorId;
}

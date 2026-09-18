/**
 * Staff users repository — PostgreSQL implementation.
 * Rows are the application profile/role for a Supabase Auth user; no
 * credentials are stored here.
 */
import { query, queryOne, queryRows } from "@/lib/database";
import { toSafeUser } from "./mappers";

export async function findUserByAuthId(authUserId) {
  const row = await queryOne("SELECT * FROM users WHERE auth_user_id = $1", [authUserId]);
  return toSafeUser(row);
}

export async function findUserByEmail(email) {
  const row = await queryOne("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return toSafeUser(row);
}

/** Link an application user to a Supabase auth user (first sign-in after seeding by email). */
export async function linkAuthUser(id, authUserId) {
  await query("UPDATE users SET auth_user_id = $2 WHERE id = $1 AND auth_user_id IS NULL", [id, authUserId]);
  return getUserById(id);
}

export async function getUserById(id) {
  const row = await queryOne("SELECT * FROM users WHERE id = $1", [id]);
  return toSafeUser(row);
}

export async function listUsers() {
  const rows = await queryRows("SELECT * FROM users ORDER BY role, full_name");
  return rows.map(toSafeUser);
}

export async function updateLastLogin(id) {
  await query("UPDATE users SET last_login_at = now() WHERE id = $1", [id]);
}

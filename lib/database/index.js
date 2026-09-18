/**
 * Database access placeholder.
 *
 * The backend phase installs the `pg` driver, creates a connection pool here
 * from `DATABASE_URL`, and runs `schema.sql` via a migration script. Until
 * then, repositories read demo data and write to `memoryStore.js`.
 *
 * Planned shape:
 *
 *   import { Pool } from "pg";
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   export const query = (text, params) => pool.query(text, params);
 */

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseStatus() {
  return {
    driver: "postgresql",
    configured: isDatabaseConfigured(),
    mode: isDatabaseConfigured() ? "postgres" : "demo-data",
  };
}

/**
 * Shared helpers for the database CLI scripts (migrate / seed / reset).
 * Runs under plain Node (not Next.js), so it loads .env.local itself and uses
 * a short-lived pool instead of the application pool.
 */
import nextEnv from "@next/env";
import { Pool } from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DATABASE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.join(DATABASE_DIR, "migrations");
export const PROJECT_ROOT = path.resolve(DATABASE_DIR, "..", "..");

// @next/env is CommonJS; use the default export for interop.
nextEnv.loadEnvConfig(PROJECT_ROOT);

export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your PostgreSQL connection string.");
    process.exit(1);
  }
  return url;
}

export function createCliPool() {
  return new Pool({
    connectionString: requireDatabaseUrl(),
    max: 2,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
}

/** Redact the password when printing a connection string. */
export function describeDatabase(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? `${u.username}@` : ""}${u.host}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function run(name, main) {
  const pool = createCliPool();
  const started = Date.now();
  try {
    await main(pool);
    console.log(`${name} finished in ${Date.now() - started}ms`);
  } catch (error) {
    console.error(`${name} failed: ${error.message}`);
    if (error.code) console.error(`  code: ${error.code}`);
    if (error.detail) console.error(`  detail: ${error.detail}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

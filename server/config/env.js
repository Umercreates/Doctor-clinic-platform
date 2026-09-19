/**
 * Environment classification and production validation.
 *
 * Runs once at server start (see instrumentation.js). In production it fails
 * fast when security-critical configuration is missing so the app can never
 * silently run against demo data or without authentication. Only variable
 * NAMES are ever logged — never values.
 *
 * Browser-safe (inlined into the client bundle because of the NEXT_PUBLIC_ prefix):
 *   NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * Server-only (must never be prefixed NEXT_PUBLIC_ or reach a response):
 *   DATABASE_URL, DATABASE_SSL, DATABASE_SSL_REJECT_UNAUTHORIZED, DATABASE_POOL_MAX,
 *   SUPABASE_SECRET_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_DOCTOR_EMAIL,
 *   SEED_DOCTOR_PASSWORD, ALLOW_DEMO_MODE, LOG_FORMAT
 */

export const PUBLIC_ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

export const SERVER_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_SSL",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DATABASE_POOL_MAX",
  "SUPABASE_SECRET_KEY",
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_PASSWORD",
  "SEED_DOCTOR_EMAIL",
  "SEED_DOCTOR_PASSWORD",
  "ALLOW_DEMO_MODE",
  "LOG_FORMAT",
];

/** Variables a production deployment cannot run without. */
const REQUIRED_IN_PRODUCTION = ["NEXT_PUBLIC_SITE_URL", "DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

/** Names that would leak a secret to the browser if they existed. */
const FORBIDDEN_PUBLIC_KEYS = ["NEXT_PUBLIC_SUPABASE_SECRET_KEY", "NEXT_PUBLIC_DATABASE_URL", "NEXT_PUBLIC_SEED_ADMIN_PASSWORD", "NEXT_PUBLIC_SEED_DOCTOR_PASSWORD"];

const present = (name) => Boolean(process.env[name] && String(process.env[name]).trim());

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** Demo (no database) behaviour is only allowed outside production or with an explicit opt-in. */
export function isDemoModeAllowed() {
  return !isProduction() || process.env.ALLOW_DEMO_MODE === "true";
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Validate the environment. Returns { ok, errors, warnings }; throws in strict
 * mode (production) when there are errors. Messages name variables only.
 */
export function validateServerEnv({ strict = isProduction() } = {}) {
  const errors = [];
  const warnings = [];

  for (const name of FORBIDDEN_PUBLIC_KEYS) {
    if (process.env[name] !== undefined) errors.push(`${name} must not exist: it would expose a server secret to the browser.`);
  }

  if (strict) {
    for (const name of REQUIRED_IN_PRODUCTION) {
      if (!present(name)) {
        if (name === "DATABASE_URL" && process.env.ALLOW_DEMO_MODE === "true") {
          warnings.push("DATABASE_URL is not set: running in demo-data mode because ALLOW_DEMO_MODE=true (dashboard disabled).");
          continue;
        }
        errors.push(`Missing required environment variable: ${name}`);
      }
    }
  }

  if (present("NEXT_PUBLIC_SITE_URL")) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SITE_URL);
      if (strict && url.protocol !== "https:" && !isLocalHost(url.hostname)) {
        errors.push("NEXT_PUBLIC_SITE_URL must use https:// in production (canonical URLs, sitemap, cookies).");
      }
      if (url.pathname !== "/" && url.pathname !== "") warnings.push("NEXT_PUBLIC_SITE_URL should be an origin without a path.");
    } catch {
      errors.push("NEXT_PUBLIC_SITE_URL is not a valid absolute URL.");
    }
  }

  if (present("NEXT_PUBLIC_SUPABASE_URL")) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (url.protocol !== "https:") errors.push("NEXT_PUBLIC_SUPABASE_URL must use https://.");
    } catch {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    }
  }

  if (present("DATABASE_URL")) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      if (!/^postgres(ql)?:$/.test(url.protocol)) errors.push("DATABASE_URL must be a postgresql:// connection string.");
      if (strict && isLocalHost(url.hostname)) warnings.push("DATABASE_URL points at localhost in production.");
      if (strict && process.env.DATABASE_SSL !== "true" && !isLocalHost(url.hostname)) {
        warnings.push("DATABASE_SSL is not \"true\": the production database connection is not using TLS.");
      }
    } catch {
      errors.push("DATABASE_URL is not a valid connection string.");
    }
  }

  if (present("DATABASE_POOL_MAX") && !/^\d+$/.test(process.env.DATABASE_POOL_MAX)) errors.push("DATABASE_POOL_MAX must be an integer.");

  if (strict && (present("SEED_ADMIN_PASSWORD") || present("SEED_DOCTOR_PASSWORD"))) {
    warnings.push("SEED_*_PASSWORD variables are set in production; they are only needed while running db:seed.");
  }

  const ok = errors.length === 0;
  if (!ok && strict) {
    const error = new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
    error.name = "EnvironmentValidationError";
    throw error;
  }
  return { ok, errors, warnings };
}

/** Booleans only — safe to log or return from a health endpoint. */
export function getEnvSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    siteUrlConfigured: present("NEXT_PUBLIC_SITE_URL"),
    databaseConfigured: present("DATABASE_URL"),
    supabaseConfigured: present("NEXT_PUBLIC_SUPABASE_URL") && present("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    supabaseAdminConfigured: present("SUPABASE_SECRET_KEY"),
    demoModeAllowed: isDemoModeAllowed(),
  };
}

/**
 * Minimal structured logger for server code.
 *
 * - One line per event: `LOG_FORMAT=json` (default in production) prints JSON,
 *   otherwise a readable `[level] event key=value` line.
 * - Never pass secrets, tokens, cookies or full request bodies. Use
 *   `maskEmail()` for addresses so logs stay useful without storing PII.
 */

const REDACT_KEYS = /password|secret|token|cookie|authorization|apikey|api_key/i;

export function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "unknown";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

function sanitize(fields = {}) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (REDACT_KEYS.test(key)) {
      out[key] = "[redacted]";
    } else if (value instanceof Error) {
      out[key] = { name: value.name, message: value.message, code: value.code };
    } else {
      out[key] = value;
    }
  }
  return out;
}

function jsonOutput() {
  const format = process.env.LOG_FORMAT;
  if (format === "json") return true;
  if (format === "text") return false;
  return process.env.NODE_ENV === "production";
}

function write(level, event, fields) {
  const data = sanitize(fields);
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  if (jsonOutput()) {
    method(JSON.stringify({ time: new Date().toISOString(), level, event, ...data }));
    return;
  }
  const extras = Object.entries(data)
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" ");
  method(`[${level}] ${event}${extras ? ` ${extras}` : ""}`);
}

export const log = {
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
  error: (event, fields) => write("error", event, fields),
};

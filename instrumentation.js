/**
 * Runs once when a Next.js server instance starts (Node.js runtime only).
 * Validates the environment before the first request: in production a
 * missing security-critical variable aborts startup with a message that names
 * the variable and never prints values. In development it only warns.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateServerEnv, isProduction } = await import("./server/config/env.js");
  const { log } = await import("./server/log.js");
  // Throws (and therefore stops the server) when NODE_ENV=production.
  const result = validateServerEnv({ strict: isProduction() });
  for (const warning of result.warnings) log.warn("env.warning", { message: warning });
  for (const error of result.errors) log.error("env.error", { message: error });
  log.info("server.start", { nodeEnv: process.env.NODE_ENV, envValid: result.ok });
}

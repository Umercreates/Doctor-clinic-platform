/**
 * DEVELOPMENT ONLY: drop everything in the `public` schema, re-run migrations
 * and re-seed.  Refuses to run when NODE_ENV=production.
 *
 *   npm run db:reset
 */
import { spawnSync } from "node:child_process";
import { isProduction, run } from "./cli.mjs";

if (isProduction()) {
  console.error("db:reset is disabled in production.");
  process.exit(1);
}

await run("reset", async (pool) => {
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
  console.log("  schema dropped and recreated");
});

for (const script of ["migrate.mjs", "seed.mjs"]) {
  const result = spawnSync(process.execPath, [new URL(`./${script}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

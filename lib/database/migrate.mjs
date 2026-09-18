/**
 * Migration runner.
 *
 *   npm run db:migrate           apply pending migrations
 *   npm run db:migrate:status    show applied / pending
 *
 * Migrations are plain SQL files in lib/database/migrations, named
 * `NNNN_description.sql` and applied in order. Each file runs inside its own
 * transaction and is recorded in `schema_migrations` with a checksum so an
 * already-applied file cannot be silently edited.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MIGRATIONS_DIR, describeDatabase, run } from "./cli.mjs";

const command = process.argv[2] || "up";

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      checksum   TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function loadMigrationFiles() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  return Promise.all(
    files.map(async (file) => {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      return {
        version: file.slice(0, 4),
        name: file.replace(/\.sql$/, ""),
        file,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

async function getApplied(pool) {
  const { rows } = await pool.query("SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version");
  return new Map(rows.map((r) => [r.version, r]));
}

async function status(pool) {
  await ensureMigrationsTable(pool);
  const [files, applied] = await Promise.all([loadMigrationFiles(), getApplied(pool)]);
  console.log(`Database: ${describeDatabase(process.env.DATABASE_URL)}`);
  for (const m of files) {
    const record = applied.get(m.version);
    if (!record) console.log(`  pending  ${m.name}`);
    else if (record.checksum !== m.checksum) console.log(`  CHANGED  ${m.name} (applied ${record.applied_at.toISOString()}, file differs from applied version)`);
    else console.log(`  applied  ${m.name} (${record.applied_at.toISOString()})`);
  }
  const pending = files.filter((m) => !applied.has(m.version)).length;
  console.log(pending ? `${pending} pending migration(s).` : "Schema is up to date.");
}

async function up(pool) {
  await ensureMigrationsTable(pool);
  const [files, applied] = await Promise.all([loadMigrationFiles(), getApplied(pool)]);
  console.log(`Database: ${describeDatabase(process.env.DATABASE_URL)}`);

  for (const m of files) {
    const record = applied.get(m.version);
    if (record) {
      if (record.checksum !== m.checksum) {
        throw new Error(`Migration ${m.name} was modified after being applied. Create a new migration instead of editing applied ones.`);
      }
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(m.sql);
      await client.query("INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)", [m.version, m.name, m.checksum]);
      await client.query("COMMIT");
      console.log(`  applied  ${m.name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      error.message = `${m.name}: ${error.message}`;
      throw error;
    } finally {
      client.release();
    }
  }
  const pending = files.filter((m) => !applied.has(m.version)).length;
  console.log(pending ? `Applied ${pending} migration(s).` : "No pending migrations.");
}

run("migrate", async (pool) => {
  if (command === "status") return status(pool);
  if (command === "up") return up(pool);
  throw new Error(`Unknown command "${command}". Use "up" or "status".`);
});

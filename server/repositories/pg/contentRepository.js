/**
 * Content blocks repository — PostgreSQL implementation.
 * `content_blocks(key, value JSONB, updated_by, updated_at)`.
 */
import { query, queryOne, queryRows } from "@/lib/database";

function toBlock(row) {
  return { key: row.key, value: row.value, updatedAt: row.updated_at, updatedBy: row.updated_by };
}

export async function listContentBlocks() {
  const rows = await queryRows("SELECT key, value, updated_by, updated_at FROM content_blocks ORDER BY key");
  return rows.map(toBlock);
}

export async function getContentBlock(key) {
  const row = await queryOne("SELECT key, value, updated_by, updated_at FROM content_blocks WHERE key = $1", [key]);
  return row ? toBlock(row) : null;
}

export async function setContentBlock(key, value, updatedBy = null) {
  const row = await queryOne(
    `INSERT INTO content_blocks (key, value, updated_by) VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
     RETURNING key, value, updated_by, updated_at`,
    [key, JSON.stringify(value), updatedBy],
  );
  return toBlock(row);
}

export async function deleteContentBlock(key) {
  const { rowCount } = await query("DELETE FROM content_blocks WHERE key = $1", [key]);
  return rowCount > 0;
}

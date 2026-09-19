-- =============================================================================
-- 0003 — Shared rate-limit counters
-- -----------------------------------------------------------------------------
-- Fixed-window counters for public/auth endpoints (see server/security/
-- rateLimit.js). Stored in PostgreSQL so every application instance shares the
-- same limits. Keys are policy name + SHA-256 of the identifier, so the table
-- never stores raw IP addresses or email addresses. Rows are pruned
-- opportunistically.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

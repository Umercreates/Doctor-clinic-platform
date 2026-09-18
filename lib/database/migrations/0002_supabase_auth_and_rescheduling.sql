-- =============================================================================
-- 0002 — Supabase Auth as the authentication authority + rescheduling support
-- -----------------------------------------------------------------------------
-- Authentication (passwords, sessions, identity) now lives in Supabase Auth.
-- The application `users` table remains the profile/role mapping: each row
-- links to a Supabase auth user through `auth_user_id`.
--
-- Removed:
--   users.password_hash  — passwords are stored by Supabase Auth only
--   sessions             — custom session tokens are no longer issued
-- Added:
--   users.auth_user_id   — Supabase `auth.users.id`
--   appointments.rescheduled_* — history for the reschedule flow
--   schedule_exceptions.updated_at (+ trigger) — editable from the dashboard
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

DROP TABLE IF EXISTS sessions;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS rescheduled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_from_date DATE,
  ADD COLUMN IF NOT EXISTS rescheduled_from_time TIME,
  ADD COLUMN IF NOT EXISTS reschedule_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by            UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE schedule_exceptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS trg_schedule_exceptions_updated_at ON schedule_exceptions;
CREATE TRIGGER trg_schedule_exceptions_updated_at
  BEFORE UPDATE ON schedule_exceptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 0001 — Initial schema (Doctor medical practice)
-- -----------------------------------------------------------------------------
-- Applied by `npm run db:migrate` inside a transaction. Requires PostgreSQL 13+.
-- Extensions must already exist (created by a superuser or `npm run db:migrate`
-- when the connecting role has permission).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- = operators inside exclusion constraints

-- ---------------------------------------------------------------------------
-- Enums & range types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contact_message_status AS ENUM ('new', 'read', 'replied', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Range over TIME so overlapping appointments on the same day can be excluded.
DO $$ BEGIN
  CREATE TYPE timerange AS RANGE (subtype = time);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   TEXT NOT NULL UNIQUE,
  name                   TEXT NOT NULL,
  title                  TEXT,
  role                   TEXT NOT NULL DEFAULT 'Medical Professional',
  role_is_demo           BOOLEAN NOT NULL DEFAULT TRUE,
  is_lead                BOOLEAN NOT NULL DEFAULT FALSE,
  location               TEXT,
  photo_url              TEXT,
  photo_alt              TEXT,
  photo_position         TEXT,
  short_bio              TEXT,
  bio                    TEXT[] NOT NULL DEFAULT '{}',
  bio_is_demo            BOOLEAN NOT NULL DEFAULT TRUE,
  languages              TEXT[] NOT NULL DEFAULT '{}',
  accepting_new_patients BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_care_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (doctor_id, label)
);
CREATE INDEX IF NOT EXISTS idx_doctor_care_areas_doctor ON doctor_care_areas(doctor_id);

-- Weekly recurring availability. weekday: 0 = Sunday ... 6 = Saturday.
-- A doctor may have several blocks per weekday (e.g. morning + afternoon).
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  weekday     SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  -- Blocks for the same doctor/weekday must not overlap.
  EXCLUDE USING gist (
    doctor_id WITH =,
    weekday WITH =,
    timerange(start_time, end_time, '[)') WITH &&
  ) WHERE (is_active)
);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, weekday);

-- One-off exceptions: blocked dates/times or extra availability.
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID REFERENCES doctors(id) ON DELETE CASCADE, -- NULL = whole clinic
  date         DATE NOT NULL,
  start_time   TIME,                                          -- NULL = whole day
  end_time     TIME,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,                -- FALSE = blocked, TRUE = extra availability
  reason       TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions(doctor_id, date);

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  icon              TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  price_cents       INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  short_description TEXT,
  description       TEXT[] NOT NULL DEFAULT '{}',
  highlights        TEXT[] NOT NULL DEFAULT '{}',
  is_demo           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_services (
  doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_doctor_services_service ON doctor_services(service_id);

-- ---------------------------------------------------------------------------
-- Staff users & sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'staff',
  doctor_id      UUID UNIQUE REFERENCES doctors(id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,      -- HMAC-SHA256(SESSION_SECRET, token); raw token only lives in the cookie
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent    TEXT,
  ip_address    TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ---------------------------------------------------------------------------
-- Patients & appointments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_email ON patients (lower(email));

CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT NOT NULL UNIQUE,
  doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  service_id       UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           appointment_status NOT NULL DEFAULT 'pending',
  patient_notes    TEXT,
  internal_notes   TEXT,
  source           TEXT NOT NULL DEFAULT 'website',
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  confirmed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  -- Double-booking prevention: a doctor cannot hold two overlapping active
  -- appointments on the same day. Enforced at the database level.
  EXCLUDE USING gist (
    doctor_id WITH =,
    appointment_date WITH =,
    timerange(start_time, end_time, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'rescheduled'))
);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Optional pre-generated slots (booking phase). Derived from doctor_schedules
-- and schedule_exceptions; unique per doctor/date/start.
CREATE TABLE IF NOT EXISTS time_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id      UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  slot_date      DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (doctor_id, slot_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, slot_date);

-- ---------------------------------------------------------------------------
-- Content & settings (dashboard-managed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,       -- stable identifier used by seeds/content editing
  category    TEXT NOT NULL DEFAULT 'general',
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name   TEXT NOT NULL,
  quote         TEXT NOT NULL,
  doctor_id     UUID REFERENCES doctors(id) ON DELETE SET NULL,
  rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_blocks (
  key         TEXT PRIMARY KEY,           -- e.g. 'home.hero', 'about.mission'
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS website_settings (
  key         TEXT PRIMARY KEY,           -- 'profile', 'address', 'contact', 'hours', 'social', 'booking', 'seo'
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference   TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  topic       TEXT NOT NULL DEFAULT 'general',
  message     TEXT NOT NULL,
  status      contact_message_status NOT NULL DEFAULT 'new',
  source      TEXT NOT NULL DEFAULT 'website',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         notification_channel NOT NULL,
  status          notification_status NOT NULL DEFAULT 'queued',
  recipient_user  UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE CASCADE,
  template        TEXT NOT NULL,            -- e.g. 'appointment.requested', 'appointment.confirmed'
  payload         JSONB NOT NULL DEFAULT '{}',
  sent_at         TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, created_at);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'doctors','doctor_schedules','services','patients','appointments','users','faqs',
    'testimonials','content_blocks','website_settings','contact_messages','time_slots'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

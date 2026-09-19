# Doctor — Medical Practice Website & Appointment Platform

Premium clinic website for **Doctor** (Los Angeles, California), led by Dr. Williams, with online appointment
booking, a real availability engine and a secure staff dashboard.

- **Frontend / app:** Next.js 16 (App Router) + React 19, **JavaScript only** (`.js` / `.jsx`), Tailwind CSS v4, Inter
- **Backend:** Node.js REST API served through Next.js Route Handlers (`app/api/v1/*`)
- **Database:** PostgreSQL via the `pg` driver, plain SQL migrations, no ORM
- **Auth:** Supabase Auth (identity, passwords, sessions) + application roles stored in PostgreSQL

## 1. Requirements

- Node.js **22.12+** (24 recommended) and npm
- PostgreSQL **13+** (developed against 17). Extensions `pgcrypto` and `btree_gist` must be available
  (they ship with every standard PostgreSQL install).
- A Supabase project (only Auth is used). Copy the Project URL, **publishable** key and **secret** key from
  *Project Settings → API keys*.

## 2. Installation

```bash
npm install
cp .env.example .env.local   # then edit the values (see below)
```

## 3. Environment variables

`.env.local` is git-ignored. Never commit real secrets. `server/config/env.js` validates the variables at startup:
with `NODE_ENV=production` the server refuses to start when a required one is missing (it names the variable, never
prints values); in development it only warns.

**Public / browser-safe** (`NEXT_PUBLIC_*`, inlined into the client bundle)

| Variable                               | Required in production | Purpose                                                              |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | yes (https)            | Canonical origin for metadata, sitemap, Open Graph and the CSRF check |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes                    | Supabase project URL                                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes                    | Supabase publishable key                                             |

**Server-only** (never `NEXT_PUBLIC_`, never returned by an API, never logged)

| Variable                 | Required in production | Purpose                                                                    |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`           | yes                    | PostgreSQL connection string                                               |
| `DATABASE_SSL`           | recommended            | `true` for hosted databases that require TLS                               |
| `SUPABASE_SECRET_KEY`    | seeding only           | Used by `db:seed` to create staff identities; not read by page/API code    |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seeding only | Admin identity created by `db:seed` (password generated if empty)  |
| `SEED_DOCTOR_EMAIL` / `SEED_DOCTOR_PASSWORD` | seeding only | Doctor identity (default `dr.williams@doctor-clinic-demo.com`)   |
| `LOG_FORMAT`             | no                     | `json` (default in production) or `text`                                   |
| `ALLOW_DEMO_MODE`        | no                     | Only for a database-less demo of the public site; never for a real clinic  |

Without `DATABASE_URL` (development only) the public website runs on the bundled demo catalogue and bookings are
kept in memory; staff sign-in and the dashboard require the database and the Supabase variables.

## 4. PostgreSQL setup

Create a role and database (any name works — put the values in `DATABASE_URL`):

```sql
CREATE ROLE doctor_clinic WITH LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE doctor_clinic OWNER doctor_clinic;
\c doctor_clinic
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

## 5. Migrations

```bash
npm run db:migrate          # apply pending migrations
npm run db:migrate:status   # list applied / pending
```

Migrations are plain SQL files in `lib/database/migrations/NNNN_name.sql`, applied in order, each inside a
transaction, and recorded in `schema_migrations` with a checksum (an applied file that is edited later is
rejected — add a new migration instead).

| Migration                                  | Purpose                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `0001_initial_schema`                      | Doctors, services, schedules, exceptions, patients, appointments (exclusion constraint), users, content, settings |
| `0002_supabase_auth_and_rescheduling`      | `users.auth_user_id`, drops `password_hash` + custom `sessions`, reschedule history columns   |

## 6. Seed data

```bash
npm run db:seed                      # upsert doctors, services, schedules, FAQs, settings; create staff accounts
npm run db:seed -- --reset-passwords # also reset the seeded users' passwords from the env variables
npm run db:setup                     # migrate + seed
npm run db:reset                     # DEV ONLY: drop schema, migrate, seed
```

Seed content comes from `data/*.js` (the provided doctor names and photos; everything marked demo stays demo).
Staff accounts are created **in Supabase Auth** through the server-side admin API (needs `SUPABASE_SECRET_KEY`)
and linked to a role row in the `users` table. Passwords come from the environment or are generated and printed
once; they are never stored in the application database. Re-running the seed never duplicates identities.

## 7. Development

```bash
npm run dev      # http://localhost:3000
npm run lint
```

## 8. Production

See section 13 for the full deployment guide. Short version:

```bash
npm ci
npm run db:migrate      # never db:reset or db:seed against a live database
npm run build
npm start               # NODE_ENV=production; env validation runs before the first request
```

## 9. Demo / admin login

After `npm run db:setup`, sign in at `/dashboard/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(role **admin**) or the doctor account (role **doctor** — sees only their own appointments, patients and schedule).
Passwords live in Supabase Auth; reset them with `npm run db:seed -- --reset-passwords` or from the Supabase dashboard.

## 10. Authentication architecture

```
Browser ──POST /api/v1/auth/login──▶ authService.login
                                      ├─ validate input, rate-limit attempts (per IP and per IP+account, PostgreSQL-backed)
                                      ├─ supabase.auth.signInWithPassword   (Supabase verifies the password)
                                      └─ resolveAppUser: users.auth_user_id → role (admin / staff / doctor)
        ◀── Supabase session cookies (SameSite=Lax; Secure in production; managed by @supabase/ssr)
Browser ──GET /dashboard/* ──▶ proxy.js refreshes the Supabase session; no user → /dashboard/login
                             ▶ app/dashboard/(app)/layout.js resolves the application user (role) on every request
Browser ──/api/v1/* ──────────▶ requireUser / requirePermission / requireScopedPermission (server/auth/currentUser.js)
Browser ──POST /api/v1/auth/logout──▶ supabase.auth.signOut → cookies cleared
```

- **Identity & passwords:** Supabase Auth. No password material exists in the application database (`users` holds
  email, name, role, `doctor_id`, `auth_user_id`). `getUser()` validates every session with Supabase — cookies alone
  are never trusted.
- **Clients:** `lib/supabase/server.js` (server components / route handlers, cookie-bound), `lib/supabase/client.js`
  (browser, publishable key only), `lib/supabase/admin.js` (secret key, server only — seeding).
- **Roles:** `admin` (everything), `doctor` (own appointments / patients / availability), `staff` (front desk). See
  `server/auth/permissions.js`. Navigation hides what a role cannot use **and** every page/API enforces it server-side.
- **Errors:** consistent `{ success, data | error }` envelope; database errors are translated to safe messages
  (`lib/database/index.js`) and never expose SQL or stack traces.

## 11. Availability & booking engine

- Slots are computed server-side (`server/services/availabilityService.js`) from weekly schedule blocks (several per
  weekday), schedule exceptions (blocked days / time ranges, extra hours, clinic-wide closures), active appointments
  and the service duration (a 45-minute service yields 45-minute slots).
- `GET /api/v1/appointments/availability?doctor&service&date` returns `{ startTime, endTime, available }` per slot;
  `…/availability/days?from&to` returns the dates that still have an open slot (drives the calendar).
- Booking: validate → check slot → transaction (advisory lock per doctor/day → re-check → upsert patient → insert) →
  PostgreSQL exclusion constraint. Concurrent requests for one slot yield exactly one `201`; the rest receive
  `409 SLOT_UNAVAILABLE`.
- Rescheduling moves the appointment inside a transaction (row lock, availability re-check excluding itself) and
  records the previous slot; cancellation keeps history and releases the slot immediately. Status transitions are
  validated server-side (`lib/validation/appointmentAdmin.js`).

## 12. Content management, settings & SEO

- **Website content** (`/dashboard/content`, admin only) edits the `content_blocks` table: homepage hero,
  introduction, "why our practice", final call-to-action, About page sections and the footer text. Fields are declared
  once in `data/content.js` and validated by `lib/validation/content.js` on both the form and the API. Copy may use
  `{clinic}`, `{city}`, `{state}` and `{leadDoctor}` tokens. "Restore default" removes the row so the bundled default
  shows again.
- **FAQs** (same page) are full CRUD on the `faqs` table (key, question, answer, category, featured, published,
  order). The public FAQ page and homepage preview read the database and render an empty state when nothing is
  published.
- **Testimonials** are only shown publicly when `is_published` **and** `consent_given` are both true; the homepage
  section is omitted entirely when there are none. Ratings are stored for records but never emitted as structured
  data.
- **Settings** (`/dashboard/settings`) edits the `website_settings` table: clinic profile, contact, address, opening
  hours, social links, notices and booking rules (window, lead time, slot grid, default slot length). Only public
  information lives there; environment secrets are never read or returned by the settings API. Groups flagged
  "placeholder" keep the demo label on the site and are left out of JSON-LD until verified.
- **Doctors / services** (`/dashboard/doctors`, `/dashboard/services`) create, edit and deactivate profiles, assign
  services ↔ doctors, set duration and price, and link to the weekly schedule (`/dashboard/schedule?doctor=<id>`).
- **Revalidation**: every admin write calls `server/revalidation.js`, which runs targeted `revalidatePath` calls
  (doctor pages, service pages, FAQ page, homepage, or the shared layout for settings/footer), so changes are live
  without a rebuild.
- **SEO**: per-page `generateMetadata` from settings, `app/sitemap.js` (public pages only, `lastModified` from the
  database), `app/robots.js` (dashboard and API disallowed), JSON-LD for the clinic (`MedicalClinic` + `WebSite`),
  doctors (`Physician`), services (`MedicalProcedure`), FAQs (`FAQPage`) and breadcrumbs. Only verified facts are
  emitted: placeholder phone/address/hours and ratings are omitted.
- **Status codes**: public pages return real `404`s for unknown slugs. Inside the dashboard, `loading.js` streams the
  shell first, so a missing record renders the not-found view with `noindex` (Next.js documents this as a `200`).

## Project structure

```
app/(site)/              Public website (unchanged design from phase 1)
app/dashboard/           (auth)/login and (app)/ protected shell + pages (overview, appointments[/id], patients,
                         doctors, services, schedule, content, settings)
app/api/v1/              REST API — see server/README.md for the endpoint table
components/              layout, navigation, footer, hero, home, doctors, services, appointments, faq, contact,
                         dashboard (appointments/, schedule/, content/, settings/, catalog/), ui (Toast, Modal, …)
data/                    Bundled defaults: clinic profile (settings fallback), content blocks, catalogue seed source
lib/database/            index.js (pool, query, transactions, error translation), migrations/, migrate/seed/reset scripts
lib/supabase/            env, server (cookie-bound clients), client (browser), admin (secret key, server only)
lib/validation/          Validators shared by forms and API routes
server/auth/             currentUser (Supabase → app user), permissions, rateLimit, pageGuards
server/repositories/     Facades → pg/ (PostgreSQL) or demo/ (no database)
server/services/         Use-cases: auth, appointments, availability, catalog, content (settings + blocks, cached
                         per request), faq, testimonial, patients, schedule, contact
server/revalidation.js   Targeted revalidatePath helpers called by every admin write
server/config/env.js     Environment classification + production validation (run from instrumentation.js)
server/security/         headers (CSP + security headers), csrf (origin checks), rateLimit (PostgreSQL-backed)
server/log.js            Structured logger (masks emails, redacts secret-like keys)
proxy.js                 CSRF check for /api, dashboard session refresh + nonce CSP (Next.js 16 middleware)
scripts/                 verify-auth.mjs, verify-security.mjs (run against a live server)
```

## 13. Production deployment

### Requirements

- Node.js 22.12+ (24 recommended), `npm ci`.
- PostgreSQL 13+ with `pgcrypto` and `btree_gist` (Supabase Postgres or any managed instance), reachable over TLS.
- A Supabase project for Auth (identity, passwords, sessions).
- A domain served over HTTPS (HSTS is emitted in production; cookies are `Secure`).
- The environment variables from section 3 set on the host (never committed).

### Sequence

1. Create the production Supabase project. In *Authentication → URL configuration* set the **Site URL** to your
   domain and add `https://your-domain/dashboard/login` to the redirect allow-list. Keep email confirmation on for
   staff accounts (the seed marks its accounts confirmed through the admin API). Password recovery emails point at
   the Supabase-hosted flow; the dashboard has no self-service reset page.
2. Create the production database and run `npm run db:migrate` (migrations are checksum-locked, applied in order,
   each in a transaction; run them from a machine that can reach the database with the production `DATABASE_URL`).
   Take a database backup before every later migration; migrations are forward-only — roll back by restoring the
   backup.
3. Create the staff identities: `npm run db:seed -- --force-production` **only on a fresh database** (the seed
   UPSERTS demo doctors/services/FAQs/settings and refuses to run in production without the flag). On an existing
   database create staff users through Supabase Auth and insert the matching `users` row instead.
4. Set the environment variables on the host (`NEXT_PUBLIC_SITE_URL` must be the https origin). Remove
   `SEED_*_PASSWORD` and `SUPABASE_SECRET_KEY` from the running app once seeding is done — the app never reads them.
5. `npm run build` and `npm start` (or your platform's equivalent). A missing required variable aborts startup.
6. Verify: HTTPS + headers (`curl -I https://your-domain/`), `/api/v1/health` returns `{"status":"ok"}`, sign in at
   `/dashboard/login`, book a test appointment, confirm it in the dashboard, then delete the test data.
7. Run the regression matrix against the deployment: `node scripts/verify-security.mjs https://your-domain --production`
   (creates and removes its own test rows; requires the seed credentials locally).

**Not done by this repository:** nothing has been deployed. Everything above was verified against a local
production build (`next build` + `next start`) only.

## 14. Security

- **Authentication:** Supabase Auth only (`/api/v1/auth/login|logout|me`). No custom password or session system;
  the app database stores no password hashes. Every request re-validates the session with `getUser()`.
- **Authorization:** roles `admin`, `staff`, `doctor` with `:own` scoping (`server/auth/permissions.js`). Enforced
  in the proxy (session), the dashboard layout (route → permission map), every page and every API route. Doctors
  only see their own appointments, patients and schedule.
- **CSRF:** state-changing `/api/v1/*` requests are checked in `proxy.js` (`server/security/csrf.js`):
  `Sec-Fetch-Site: cross-site` is rejected; a present `Origin` (or, failing that, `Referer`) must match
  `NEXT_PUBLIC_SITE_URL` or the request's own host; `Origin: null` is rejected. Requests with neither header come
  from non-browser clients that cannot carry ambient cookies and are allowed. Supabase cookies are also
  `SameSite=Lax`. Public GET endpoints are not affected; public booking/contact keep working from the site.
- **Rate limiting:** fixed windows stored in the `rate_limits` table (shared by all instances of the same
  database; keys are hashed, no raw IPs/emails stored): sign-in 30/15 min per IP and 10/15 min per IP+account,
  booking 20/hour per IP and 6/hour per email, contact 5/hour per IP, availability 120/min per IP. Exceeding a
  limit returns `429 RATE_LIMITED` with `Retry-After`. Without a database (demo mode) a per-process in-memory
  fallback is used, which is **not** multi-instance safe. If the store is unreachable the request is allowed and
  the failure is logged. Client IPs come from `X-Forwarded-For`, so deploy behind a platform/proxy that sets it.
- **Headers** (`next.config.mjs` + `server/security/headers.js`): `Content-Security-Policy` (public pages:
  `script-src 'self' 'unsafe-inline'` because statically rendered pages cannot use nonces; dashboard: per-request
  nonce + `'strict-dynamic'`; `style-src 'unsafe-inline'` for Tailwind/React style attributes; `frame-src` only the
  contact-page map embed; no `unsafe-eval` in production), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security` in production,
  `Cache-Control: no-store` + `X-Robots-Tag: noindex` on `/dashboard/*` and `/api/*`, `X-Powered-By` removed.
- **Input validation:** every route validates with the shared validators in `lib/validation/*` (lengths, enums,
  UUIDs, dates/times, pagination bounds, search length); unknown fields are dropped so mass assignment is
  impossible; all SQL is parameterised and search text is LIKE-escaped.
- **Errors & logs:** clients receive `{ success:false, error:{ code, message } }` only. Unexpected errors are
  logged server-side (structured, `server/log.js`); logs never include passwords, tokens, cookies, request bodies or
  patient details (emails are masked).
- **Patient data:** appears only behind authentication (dashboard + scoped APIs). Public pages, sitemap, JSON-LD
  and public APIs never include patient records (verified by `verify:security`). Booking responses expose only the
  booking patient's own details. This architecture is built with privacy and security in mind, but it has **not**
  been assessed for HIPAA or any other regulatory regime — obtain a compliance/legal review before handling regulated
  health information.
- **Secrets:** only in environment variables; `.env.local` is git-ignored, `.env.example` holds placeholders; no
  secret is ever written to a response, page, log or `NEXT_PUBLIC_` variable (startup validation refuses
  `NEXT_PUBLIC_*SECRET*`).
- **Database:** parameterised queries, transactions with advisory locks for booking, exclusion constraints for
  overlaps, soft-deletes for doctors/services, `db:reset` disabled and `db:seed` guarded in production.

## 15. Tests

All suites run against a live server (dev or `next start`) and clean up their own rows:

```bash
npm run lint
npm run build
npm run verify:auth        # Supabase Auth, roles, booking lifecycle, schedule (44 checks)
npm run verify:security    # security matrix: access, CSRF, rate limits, validation, privacy, headers (79 checks)
```

Browser-level suites (Chrome DevTools Protocol) for the booking wizard, dashboard actions, CMS and responsive/a11y
audits live outside the repository in the maintainer's tooling and were run for every phase (see the phase reports).

## 16. Limitations

- **Email/SMS notifications are not configured.** Appointment events are recorded as `queued` rows in the
  `notifications` table (`server/services/notificationService.js`) so a delivery worker can be added later; nothing
  is sent, and the confirmation screen says so honestly.
- Contact-form messages are stored in `contact_messages` and are not forwarded anywhere.
- No self-service password reset page in the dashboard (use Supabase's hosted flow or the admin API).
- Rate limiting is a fixed-window counter in PostgreSQL, not a dedicated edge WAF.
- Deployment has only been exercised locally; production hosting, DNS, TLS and Supabase URL settings are manual steps.

## Roadmap

1. **Foundation (done)** — public website, booking UI, dashboard shell, API skeleton.
2. **Backend (done)** — PostgreSQL, migrations & seed, roles, CRUD APIs.
3. **Auth + booking engine (done)** — Supabase Auth, real availability, transactional booking, reschedule/cancel,
   dashboard appointment & schedule management.
4. **CMS + SEO + polish (done)** — content/FAQ/testimonial/settings editors, doctor & service management,
   on-demand revalidation, metadata/sitemap/JSON-LD, accessibility & responsive audits, real overview metrics.
5. **Hardening (done)** — environment validation, security headers/CSP, CSRF origin checks, shared rate
   limiting, structured logging, notification outbox, security regression suite, deployment guide.

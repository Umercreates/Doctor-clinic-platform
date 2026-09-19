# Server layer

Node.js / JavaScript REST API served through Next.js Route Handlers under `app/api/v1`.

```
app/api/v1/*            HTTP layer: parse + authorize, call a service, return the JSON envelope
server/http             ApiError + response helpers (ok / created / fail / withErrorHandling / readJson)
server/auth             currentUser (Supabase identity → application user + role), permissions,
                        rateLimit (login attempts), pageGuards (server components)
server/services         Use-cases: authService, appointmentService, availabilityService, catalogService,
                        patientService, scheduleService, contactService
server/repositories     Facade per entity → pg/ (PostgreSQL, parameterized SQL) or demo/ (bundled data)
lib/supabase            env, server (cookie-bound clients), client (browser), admin (secret key, server only)
lib/database            index.js (pool, query, withTransaction, translateDatabaseError), migrations/,
                        migrate.mjs, seed.mjs, reset.mjs, memoryStore.js (demo-mode writes)
lib/validation          Validators shared by client forms and the API
data/                   Structured demo content, also the seed source
```

## Authentication

- **Supabase Auth** owns identity, passwords and sessions. `POST /auth/login` calls
  `supabase.auth.signInWithPassword` server-side and sets the Supabase session cookies on the response;
  `POST /auth/logout` calls `signOut`.
- Every protected request resolves the caller with `supabase.auth.getUser()` (validated against Supabase,
  never trusting the cookie alone) and maps `auth.users.id` → `users.auth_user_id` to obtain the
  **application role**. A Supabase identity without a `users` row is refused (403) and signed out.
- `proxy.js` refreshes the session on `/dashboard/*` and redirects anonymous visitors to the login page.

## Response envelope

```json
{ "success": true,  "data": { ... }, "meta": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "email": "..." } } }
```

Status codes: 400 bad request · 401 not signed in · 403 forbidden · 404 not found · 409 conflict
(`SLOT_UNAVAILABLE` for bookings/reschedules, unique/overlap violations) · 422 validation · 429 rate limited ·
503 database / auth not configured.

## Endpoints (v1)

| Method          | Path                                    | Access                  | Description                                        |
| --------------- | --------------------------------------- | ----------------------- | -------------------------------------------------- |
| GET             | `/health`                               | public                  | Coarse liveness (`status`, `database`, `auth` booleans only) |
| POST            | `/auth/login`                           | public (rate limited)   | `{ email, password }` → Supabase session cookies   |
| POST            | `/auth/logout`                          | session                 | Supabase sign-out, cookies cleared                 |
| GET             | `/auth/me`                              | session                 | `{ id, name, email, role, doctorId }`              |
| GET             | `/clinic`                               | public                  | Clinic profile, hours, contact                     |
| GET             | `/faqs`                                 | public                  | Active FAQs (`?featured=1`; `?includeInactive=1` admin) |
| POST            | `/faqs`                                 | admin                   | Create FAQ                                         |
| GET/PATCH/DELETE| `/faqs/:id`                             | admin                   | Read / update / delete FAQ (UUID)                  |
| GET             | `/testimonials`                         | public                  | Published + consented (`?all=1` admin)             |
| POST            | `/testimonials`                         | admin                   | Create testimonial (draft until consent recorded)  |
| GET/PATCH/DELETE| `/testimonials/:id`                     | admin                   | Read / update / delete                             |
| GET             | `/content`                              | admin                   | Content sections with current block values         |
| PUT             | `/content/:key`                         | admin                   | Replace a content block (schema-validated)         |
| DELETE          | `/content/:key`                         | admin                   | Restore the bundled default                        |
| GET             | `/settings`                             | admin                   | Editable website settings (no secrets)             |
| PUT             | `/settings/:key`                        | admin                   | Replace one settings group (validated)             |
| GET             | `/doctors`                              | public                  | Active doctors (`?includeInactive=1` admin)        |
| POST            | `/doctors`                              | admin                   | Create doctor                                      |
| GET             | `/doctors/:id`                          | public                  | Doctor by UUID or slug, with services              |
| PATCH/PUT       | `/doctors/:id`                          | admin                   | Update profile, services, care areas               |
| DELETE          | `/doctors/:id`                          | admin                   | Deactivate (soft delete)                           |
| GET             | `/services`                             | public                  | Active services                                    |
| POST            | `/services`                             | admin                   | Create service                                     |
| GET             | `/services/:id`                         | public                  | Service by UUID or slug, with doctors              |
| PATCH/PUT       | `/services/:id`                         | admin                   | Update service (incl. `doctorIds`, `priceCents`)   |
| DELETE          | `/services/:id`                         | admin                   | Deactivate                                         |
| GET             | `/patients`                             | admin/staff; doctor=own | Paginated list, `?search=`                         |
| GET             | `/patients/:id`                         | admin/staff; doctor=own | Contact details + appointment history              |
| GET             | `/appointments/availability`            | public                  | `?doctor&service&date` → `[{ startTime, endTime, available }]` |
| GET             | `/appointments/availability/days`       | public                  | `?doctor&service&from&to` → dates with open slots  |
| POST            | `/appointments`                         | public                  | Book from the website wizard (transactional)       |
| GET             | `/appointments`                         | admin/staff; doctor=own | List with `status, date, from, to, doctorId, search` |
| GET             | `/appointments/:id`                     | scoped                  | Detail                                             |
| PATCH           | `/appointments/:id`                     | scoped                  | `{ status?, internalNotes?, cancelReason? }` (validated transitions) |
| DELETE          | `/appointments/:id`                     | scoped                  | Cancel (never hard-deletes; slot released)         |
| GET             | `/appointments/:id/reschedule?date=`    | scoped                  | Slots the appointment could move to                |
| POST            | `/appointments/:id/reschedule`          | scoped                  | `{ date, time }` — transactional move              |
| GET             | `/availability`                         | scoped                  | Weekly blocks + exceptions (`?doctorId&from&to&includeInactive=1`) |
| POST            | `/availability`                         | admin; doctor=own       | Add weekly block `{ doctorId, weekday, start, end }` |
| PATCH / DELETE  | `/availability/:id`                     | admin; doctor=own       | Update (incl. `isActive`) / remove block           |
| POST            | `/availability/exceptions`              | admin; doctor=own       | Blocked date/time or extra hours (clinic-wide = admin only) |
| PATCH / DELETE  | `/availability/exceptions/:id`          | admin; doctor=own       | Edit / remove exception                            |
| POST            | `/contact`                              | public                  | Contact form message                               |

## Roles

| Permission                | admin | staff | doctor        |
| ------------------------- | ----- | ----- | ------------- |
| appointments read/write   | all   | all   | own only      |
| patients read             | all   | all   | own only      |
| doctors / services write  | yes   | no    | no            |
| availability write        | all   | no    | own only      |
| content / settings        | yes   | no    | no            |

## Availability & booking

- `availabilityService.getAvailability` builds the day's windows from weekly blocks, subtracts blocked
  exceptions, adds extra-availability windows, then generates `serviceDuration`-long slots on a 30-minute grid
  and marks those overlapping an active appointment (pending / confirmed / rescheduled) as unavailable.
- `appointmentService.bookAppointment` validates → checks the slot → runs a transaction that takes a
  per-doctor/day advisory lock, re-checks availability with the transaction client, upserts the patient and
  inserts the row. The `appointments` exclusion constraint is the final guard, so concurrent requests yield
  one `201` and `409 SLOT_UNAVAILABLE` for the rest.
- `rescheduleAppointmentForUser` locks the row (`FOR UPDATE`), re-checks the target slot excluding the
  appointment itself, then moves it (`status = rescheduled`, previous slot recorded).
- Status transitions: `pending → confirmed | cancelled | rescheduled`; `confirmed → completed | cancelled |
  no_show | rescheduled`; `rescheduled → confirmed | completed | cancelled | no_show | rescheduled`.
  Cancelled / completed / no_show are terminal. Cancelled and completed appointments never block a slot.

## Data model highlights

- `appointments(doctor_id, appointment_date, start_time, end_time, status …)` with an **exclusion constraint** over
  `timerange(start_time, end_time)` per doctor/day for active statuses.
- `doctor_schedules` (weekly availability, `is_active`) excludes overlapping blocks per doctor/weekday;
  `schedule_exceptions` hold blocked dates/ranges and extra hours (doctor-specific or clinic-wide).
- `users(email, full_name, role, doctor_id, auth_user_id)` — no credentials; `patients` unique on `lower(email)`.
- Every foreign key is declared; doctors/services are soft-deleted (`is_active`) so history is preserved.

## Revalidation

Admin writes (doctors, services, schedule blocks, FAQs, testimonials, content blocks, settings) call the helpers in
`server/revalidation.js` after the database commit. Each helper revalidates only the public paths that render the
changed data (for example a service change touches `/`, `/services`, `/services/[slug]`, the doctor pages and the
sitemap; a settings change revalidates the shared layout). Public pages therefore stay statically cached until
something they show actually changes.

## Security layer (Prompt 5)

- `proxy.js` rejects cross-origin `POST/PUT/PATCH/DELETE` under `/api` (`server/security/csrf.js`) with a clean
  `403 FORBIDDEN` before any handler runs, and adds the nonce CSP for dashboard pages.
- `server/security/rateLimit.js` — PostgreSQL-backed fixed windows (`rate_limits`, migration 0003) for sign-in,
  booking, contact and availability; `429 RATE_LIMITED` + `Retry-After`.
- `server/config/env.js` — startup validation (via `instrumentation.js`); production refuses to start without
  `DATABASE_URL`, Supabase public config or an https `NEXT_PUBLIC_SITE_URL`.
- `server/services/notificationService.js` — outbox rows in `notifications` for appointment events; no delivery
  provider is configured, nothing is sent.
- `scripts/verify-security.mjs` (`npm run verify:security`) — the regression matrix for all of the above.


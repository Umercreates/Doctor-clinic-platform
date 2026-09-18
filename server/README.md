# Server layer

Node.js / JavaScript REST API served through Next.js Route Handlers under `app/api/v1`.

```
app/api/v1/*            HTTP layer: parse + authorize, call a service, return the JSON envelope
server/http             ApiError + response helpers (ok / created / fail / withErrorHandling / readJson)
server/auth             password (scrypt), session (HMAC tokens), cookies, permissions, rateLimit,
                        currentUser (route handlers), pageGuards (server components)
server/services         Use-cases: authService, appointmentService, availabilityService, catalogService,
                        patientService, scheduleService, contactService
server/repositories     Facade per entity → pg/ (PostgreSQL, parameterized SQL) or demo/ (bundled data)
lib/database            index.js (pool, query, withTransaction, translateDatabaseError), migrations/,
                        migrate.mjs, seed.mjs, reset.mjs, memoryStore.js (demo-mode writes)
lib/validation          Validators shared by client forms and the API
data/                   Structured demo content, also the seed source
```

## Response envelope

```json
{ "success": true,  "data": { ... }, "meta": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "email": "..." } } }
```

Status codes: 400 bad request · 401 not signed in · 403 forbidden · 404 not found · 409 conflict
(unique / overlap) · 422 validation · 429 rate limited · 503 database not configured/unavailable.

## Endpoints (v1)

| Method          | Path                                    | Access                  | Description                                        |
| --------------- | --------------------------------------- | ----------------------- | -------------------------------------------------- |
| GET             | `/health`                               | public                  | Service, database reachability, auth configured    |
| POST            | `/auth/login`                           | public (rate limited)   | `{ email, password, remember? }` → session cookie  |
| POST            | `/auth/logout`                          | session                 | Revoke session, clear cookie                       |
| GET             | `/auth/me`                              | session                 | `{ id, name, email, role, doctorId }`              |
| GET             | `/clinic`                               | public                  | Clinic profile, hours, contact                     |
| GET             | `/faqs`                                 | public                  | FAQs (`?featured=1`)                               |
| GET             | `/doctors`                              | public                  | Active doctors (`?includeInactive=1` admin)        |
| POST            | `/doctors`                              | admin                   | Create doctor                                      |
| GET             | `/doctors/:id`                          | public                  | Doctor by UUID or slug, with services              |
| PATCH/PUT       | `/doctors/:id`                          | admin                   | Update profile, services, care areas               |
| DELETE          | `/doctors/:id`                          | admin                   | Deactivate (soft delete)                           |
| GET             | `/services`                             | public                  | Active services                                    |
| POST            | `/services`                             | admin                   | Create service                                     |
| GET             | `/services/:id`                         | public                  | Service by UUID or slug, with doctors              |
| PATCH/PUT       | `/services/:id`                         | admin                   | Update service                                     |
| DELETE          | `/services/:id`                         | admin                   | Deactivate                                         |
| GET             | `/patients`                             | admin/staff; doctor=own | Paginated list, `?search=`                         |
| GET             | `/patients/:id`                         | admin/staff; doctor=own | Contact details + appointment history              |
| POST            | `/appointments`                         | public                  | Book from the website wizard                       |
| GET             | `/appointments`                         | admin/staff; doctor=own | List with `status, date, from, to, doctorId, search` |
| GET             | `/appointments/:id`                     | scoped                  | Detail                                             |
| PATCH           | `/appointments/:id`                     | scoped                  | `{ status?, internalNotes?, cancelReason? }` (validated transitions) |
| DELETE          | `/appointments/:id`                     | scoped                  | Cancel (never hard-deletes)                        |
| GET             | `/appointments/availability`            | public                  | `?doctor=&date=&service=` slots                    |
| GET             | `/availability`                         | scoped                  | Weekly blocks + exceptions (`?doctorId=&from=&to=`)|
| POST            | `/availability`                         | admin; doctor=own       | Add weekly block `{ doctorId, weekday, start, end }` |
| PATCH / DELETE  | `/availability/:id`                     | admin; doctor=own       | Update / remove block                              |
| POST            | `/availability/exceptions`              | admin; doctor=own       | Blocked date/time (clinic-wide = admin only)       |
| DELETE          | `/availability/exceptions/:id`          | admin; doctor=own       | Remove exception                                   |
| POST            | `/contact`                              | public                  | Contact form message                               |

## Roles

| Permission                | admin | staff | doctor        |
| ------------------------- | ----- | ----- | ------------- |
| appointments read/write   | all   | all   | own only      |
| patients read             | all   | all   | own only      |
| doctors / services write  | yes   | no    | no            |
| availability write        | all   | no    | own only      |
| content / settings        | yes   | no    | no            |

## Data model highlights

- `appointments(doctor_id, appointment_date, start_time, end_time, status …)` with an **exclusion constraint** over
  `timerange(start_time, end_time)` per doctor/day for active statuses — the database itself prevents double booking.
- `doctor_schedules` (weekly availability) also excludes overlapping blocks per doctor/weekday.
- `patients` unique on `lower(email)`; `users` unique on `lower(email)`; `sessions.token_hash` unique.
- Every foreign key is declared; doctors/services are soft-deleted (`is_active`) so history is preserved.

## Next phases

- **Booking engine**: schedule exceptions in availability, time-slot generation, reschedule flow, confirmations.
- **Dashboard**: editors for doctors, services, schedule, content and settings (the APIs above already exist).
- **Hardening**: CSRF tokens for cookie-authenticated writes, security headers, shared rate-limit store, tests.

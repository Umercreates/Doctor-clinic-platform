# Server layer

Node.js / JavaScript REST API served through Next.js Route Handlers under `app/api/v1`.

```
app/api/v1/*            HTTP layer: parses requests, calls services, returns the JSON envelope
server/http             ApiError + response helpers (ok / created / fail / withErrorHandling)
server/services         Use-cases (availability, booking, contact). Framework-agnostic.
server/repositories     Data access. Same async interface now (demo data) and later (PostgreSQL).
lib/database             schema.sql (PostgreSQL), memoryStore.js (demo-phase writes), index.js (pool placeholder)
lib/validation          Validators shared by client forms and the API
data/                   Structured demo content mirroring the database schema
```

## Response envelope

```json
{ "data": { ... }, "meta": { ... } }
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "email": "..." } } }
```

## Endpoints (v1)

| Method | Path                                | Description                       |
| ------ | ----------------------------------- | --------------------------------- |
| GET    | `/api/v1/health`                    | Service + data-source status      |
| GET    | `/api/v1/clinic`                    | Clinic profile, hours, contact    |
| GET    | `/api/v1/doctors`                   | Active doctors                    |
| GET    | `/api/v1/doctors/:slug`             | One doctor with their services    |
| GET    | `/api/v1/services`                  | Active services                   |
| GET    | `/api/v1/services/:slug`            | One service with related doctors  |
| GET    | `/api/v1/faqs`                      | FAQs (`?featured=1` for homepage) |
| GET    | `/api/v1/appointments/availability` | `?doctor=&date=&service=` slots   |
| POST   | `/api/v1/appointments`              | Create an appointment request     |
| POST   | `/api/v1/contact`                   | Submit a contact message          |
| POST   | `/api/v1/auth/login`                | Staff sign-in (backend phase)     |

## Roadmap

- **Backend phase**: install `pg`, create the pool in `lib/database/index.js`, run `schema.sql`, seed from `data/`, swap repositories to SQL, implement `auth/login` with sessions.
- **Booking phase**: real availability with schedule exceptions, transactional booking, database-level double-booking prevention (already modelled by the exclusion constraint), notifications.
- **Dashboard phase**: protected CRUD endpoints for appointments, patients, doctors, services, schedules, content, settings.
- **Hardening phase**: rate limiting, CSRF, security headers, tests, deployment.

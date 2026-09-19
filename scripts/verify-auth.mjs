/**
 * End-to-end verification of Supabase Auth + dashboard APIs against a running server.
 *
 *   npm run dev            (or npm run build && npm start)   in one terminal
 *   npm run db:seed        (creates the Supabase identities from SEED_* variables)
 *   node scripts/verify-auth.mjs [http://localhost:3000]
 *
 * Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_DOCTOR_EMAIL / SEED_DOCTOR_PASSWORD from .env.local.
 * Creates its own test booking through the public API and cleans it up afterwards.
 */
import nextEnv from "@next/env";
import { Pool } from "pg";

nextEnv.loadEnvConfig(process.cwd());

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || "easylifeumer@gmail.com", password: process.env.SEED_ADMIN_PASSWORD };
const DOCTOR = { email: process.env.SEED_DOCTOR_EMAIL || "dr.williams@doctor-clinic-demo.com", password: process.env.SEED_DOCTOR_PASSWORD };

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set in .env.local.");
  process.exit(1);
}
if (!ADMIN.password || !DOCTOR.password) {
  console.error("SEED_ADMIN_PASSWORD and SEED_DOCTOR_PASSWORD must be set in .env.local (the seed used them).");
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

/** Minimal cookie jar so one "browser" keeps its Supabase session between calls. */
function jar() {
  const cookies = new Map();
  return {
    header() { return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; "); },
    absorb(res) {
      for (const raw of res.headers.getSetCookie?.() || []) {
        const [pair, ...attrs] = raw.split(";");
        const [name, ...rest] = pair.split("=");
        const value = rest.join("=");
        const expired = attrs.some((a) => /max-age=0|expires=thu, 01 jan 1970/i.test(a.trim()));
        if (expired || value === "") cookies.delete(name.trim());
        else cookies.set(name.trim(), value);
      }
    },
    size() { return cookies.size; },
  };
}

async function call(session, path, { method = "GET", body, redirect = "manual" } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(session?.size() ? { cookie: session.header() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  session?.absorb(res);
  let json = null;
  try { json = await res.clone().json(); } catch {}
  return { status: res.status, json, location: res.headers.get("location") || "" };
}

const isRedirectToLogin = (r) => [302, 303, 307, 308].includes(r.status) && r.location.includes("/dashboard/login");
const iso = (d) => d.toISOString().slice(0, 10);
function nextWeekday(weekday, offsetWeeks = 0) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7 || 7) + offsetWeeks * 7); return iso(d); }

const admin = jar();
const doctor = jar();
const anon = jar();

// ---- Login -----------------------------------------------------------------------------
let r = await call(anon, "/api/v1/auth/login", { method: "POST", body: {} });
check("login: missing credentials → 422", r.status === 422);
r = await call(anon, "/api/v1/auth/login", { method: "POST", body: { email: ADMIN.email, password: "definitely-wrong-password" } });
check("login: wrong password → 401 with generic message", r.status === 401 && anon.size() === 0, r.json?.error?.message);
r = await call(admin, "/api/v1/auth/login", { method: "POST", body: ADMIN });
check("login: admin via Supabase → 200, role admin, cookies set", r.status === 200 && r.json?.data?.user?.role === "admin" && admin.size() > 0, JSON.stringify(r.json?.data?.user));
check("login: response carries no token/password/secret", !/access_token|refresh_token|password|secret/i.test(JSON.stringify(r.json)));
r = await call(doctor, "/api/v1/auth/login", { method: "POST", body: DOCTOR });
check("login: doctor via Supabase → 200, role doctor with doctorId", r.status === 200 && r.json?.data?.user?.role === "doctor" && Boolean(r.json?.data?.user?.doctorId));
const doctorId = r.json?.data?.user?.doctorId;

// ---- Session / me ----------------------------------------------------------------------
r = await call(anon, "/api/v1/auth/me");
check("me: anonymous → 401", r.status === 401);
r = await call(admin, "/api/v1/auth/me");
check("me: admin session → safe profile only", r.status === 200 && Object.keys(r.json.data.user).sort().join() === "doctorId,email,id,name,role");
r = await call(admin, "/api/v1/auth/me");
check("session persists across requests (page refresh)", r.status === 200);

// ---- Dashboard protection ----------------------------------------------------------------
for (const p of ["/dashboard", "/dashboard/appointments", "/dashboard/patients", "/dashboard/schedule", "/dashboard/settings"]) {
  r = await call(anon, p);
  check(`dashboard: ${p} anonymous → redirect to login`, isRedirectToLogin(r), r.location);
}
r = await call(admin, "/dashboard");
check("dashboard: admin → 200", r.status === 200);
r = await call(admin, "/dashboard/login");
check("dashboard: signed-in user on login page → redirected to /dashboard", [302, 303, 307, 308].includes(r.status) && r.location.endsWith("/dashboard"));
r = await call(doctor, "/dashboard/settings");
check("dashboard: doctor on admin-only page → denied redirect", [302, 303, 307, 308].includes(r.status) && r.location.includes("denied=1"));
r = await call(doctor, "/dashboard/appointments");
check("dashboard: doctor on appointments → 200", r.status === 200);

// ---- Role scoping ---------------------------------------------------------------------------
r = await call(doctor, "/api/v1/appointments");
check("api: doctor sees only own appointments", r.status === 200 && r.json.data.every((a) => a.doctorId === doctorId), `count=${r.json?.data?.length}`);
r = await call(doctor, "/api/v1/appointments?doctorId=00000000-0000-0000-0000-000000000000");
check("api: doctor filtering another doctor → 403", r.status === 403);
r = await call(doctor, "/api/v1/doctors", { method: "POST", body: { name: "X", slug: "x-y" } });
check("api: doctor creating a doctor → 403", r.status === 403);
r = await call(admin, "/api/v1/patients");
check("api: admin lists patients", r.status === 200 && Array.isArray(r.json.data));

// ---- Booking → confirm → reschedule → cancel ------------------------------------------------
const doctors = (await call(anon, "/api/v1/doctors")).json.data;
const jones = doctors.find((d) => d.slug === "dr-jones") || doctors[0];
const serviceId = jones.serviceIds[0];
const wednesday = nextWeekday(3, 2);
const avail = (await call(anon, `/api/v1/appointments/availability?doctor=${jones.id}&service=${serviceId}&date=${wednesday}`)).json.data.slots.filter((s) => s.available);
check("availability: open slots for the test date", avail.length >= 2, `${avail.length} open`);
r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: jones.id, serviceId, date: wednesday, time: avail[0].startTime, patient: { fullName: "Verify Auth Tester", email: "verify-auth-tester@example.com", phone: "(213) 555-0199" } } });
check("booking: public booking → 201", r.status === 201, r.json?.data?.reference);
const reference = r.json?.data?.reference;
const list = await call(admin, `/api/v1/appointments?search=${reference}`);
const appointment = list.json?.data?.[0];
check("dashboard api: admin finds the booking by reference", Boolean(appointment) && appointment.status === "pending");

r = await call(doctor, `/api/v1/appointments/${appointment.id}`);
check("api: other doctor cannot open this appointment → 403", r.status === 403 || (jones.id === doctorId && r.status === 200));
r = await call(admin, `/api/v1/appointments/${appointment.id}`, { method: "PATCH", body: { status: "completed" } });
check("transition: pending → completed rejected (422)", r.status === 422);
r = await call(admin, `/api/v1/appointments/${appointment.id}`, { method: "PATCH", body: { status: "confirmed" } });
check("transition: pending → confirmed", r.status === 200 && r.json.data.status === "confirmed");

r = await call(admin, `/api/v1/appointments/${appointment.id}/reschedule?date=${wednesday}`);
const options = r.json?.data?.slots?.filter((s) => s.available) || [];
check("reschedule: options include the appointment's own slot as free", options.some((s) => s.startTime === avail[0].startTime));
const target = options.find((s) => s.startTime !== avail[0].startTime);
r = await call(admin, `/api/v1/appointments/${appointment.id}/reschedule`, { method: "POST", body: { date: wednesday, time: target.startTime } });
check("reschedule: moved to a new slot, status rescheduled, history kept", r.status === 200 && r.json.data.time === target.startTime && r.json.data.status === "rescheduled" && r.json.data.rescheduledFrom?.time === avail[0].startTime);
const after = (await call(anon, `/api/v1/appointments/availability?doctor=${jones.id}&service=${serviceId}&date=${wednesday}`)).json.data.slots;
check("reschedule: old slot free again, new slot taken", after.find((s) => s.startTime === avail[0].startTime)?.available === true && after.find((s) => s.startTime === target.startTime)?.available === false);
r = await call(admin, `/api/v1/appointments/${appointment.id}/reschedule`, { method: "POST", body: { date: wednesday, time: target.startTime } });
check("reschedule: same slot again → 422", r.status === 422);

r = await call(admin, `/api/v1/appointments/${appointment.id}?reason=verify`, { method: "DELETE" });
check("cancel: → cancelled with reason", r.status === 200 && r.json.data.status === "cancelled" && r.json.data.cancelReason === "verify");
const released = (await call(anon, `/api/v1/appointments/availability?doctor=${jones.id}&service=${serviceId}&date=${wednesday}`)).json.data.slots;
check("cancel: slot released", released.find((s) => s.startTime === target.startTime)?.available === true);
r = await call(admin, `/api/v1/appointments/${appointment.id}`, { method: "PATCH", body: { status: "confirmed" } });
check("transition: cancelled is terminal (422)", r.status === 422);

// ---- Schedule management ------------------------------------------------------------------
r = await call(doctor, "/api/v1/availability", { method: "POST", body: { doctorId, weekday: 0, start: "10:00", end: "12:00" } });
check("schedule: doctor adds own Sunday block → 201", r.status === 201);
const blockId = r.json?.data?.id;
r = await call(doctor, `/api/v1/availability/${blockId}`, { method: "PATCH", body: { isActive: false } });
check("schedule: deactivate block", r.status === 200 && r.json.data.isActive === false);
r = await call(admin, `/api/v1/availability/${blockId}`, { method: "DELETE" });
check("schedule: admin deletes block", r.status === 200 && r.json.data.deleted);
r = await call(doctor, "/api/v1/availability/exceptions", { method: "POST", body: { date: wednesday, reason: "verify" } });
check("schedule: doctor clinic-wide exception → 403", r.status === 403);
r = await call(admin, "/api/v1/availability/exceptions", { method: "POST", body: { date: wednesday, reason: "verify clinic closed" } });
check("schedule: admin clinic-wide blocked date → 201", r.status === 201);
const exceptionId = r.json?.data?.id;
const blocked = (await call(anon, `/api/v1/appointments/availability?doctor=${jones.id}&service=${serviceId}&date=${wednesday}`)).json.data;
check("schedule: blocked date removes public availability", blocked.slots.length === 0 && blocked.reason === "blocked");
r = await call(admin, `/api/v1/availability/exceptions/${exceptionId}`, { method: "PATCH", body: { reason: "verify edited" } });
check("schedule: edit exception", r.status === 200 && r.json.data.reason === "verify edited");
r = await call(admin, `/api/v1/availability/exceptions/${exceptionId}`, { method: "DELETE" });
check("schedule: delete exception", r.status === 200);

// ---- Logout -----------------------------------------------------------------------------
r = await call(admin, "/api/v1/auth/logout", { method: "POST", body: {} });
check("logout: 200 and cookies cleared", r.status === 200 && admin.size() === 0);
r = await call(admin, "/api/v1/auth/me");
check("logout: session no longer valid → 401", r.status === 401);
await call(doctor, "/api/v1/auth/logout", { method: "POST", body: {} });

// ---- Cleanup ------------------------------------------------------------------------------
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE email = 'verify-auth-tester@example.com')");
  await pool.query("DELETE FROM patients WHERE email = 'verify-auth-tester@example.com'");
  await pool.end();
}

const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);

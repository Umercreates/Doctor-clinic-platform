/**
 * Security regression matrix against a running server (dev or production build).
 *
 *   npm run dev   (or npm run build && npm start -- -p 3000)
 *   node scripts/verify-security.mjs [http://localhost:3000] [--production]
 *
 * Covers: anonymous/role access, CSRF origin checks, rate limiting (429),
 * input validation, double booking, safe error bodies, patient-data privacy
 * on public pages, sitemap/robots scope, security headers and secret exposure.
 * Uses SEED_ADMIN_* / SEED_DOCTOR_* from .env.local, creates a temporary staff
 * account when SUPABASE_SECRET_KEY is available, and cleans up everything it
 * creates. Never prints secret values.
 */
import nextEnv from "@next/env";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/+$/, "");
/** Pass --production when the target is `next start`: the CSP must then contain no 'unsafe-eval'. */
const expectProduction = args.includes("--production");
const ORIGIN = new URL(BASE).origin;
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || "easylifeumer@gmail.com", password: process.env.SEED_ADMIN_PASSWORD };
const DOCTOR = { email: process.env.SEED_DOCTOR_EMAIL || "dr.williams@doctor-clinic-demo.com", password: process.env.SEED_DOCTOR_PASSWORD };
const STAFF = { email: "security-staff@example.com", password: `Staff-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}!` };

if (!process.env.DATABASE_URL || !ADMIN.password || !DOCTOR.password) {
  console.error("DATABASE_URL, SEED_ADMIN_PASSWORD and SEED_DOCTOR_PASSWORD must be set in .env.local.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + String(detail).slice(0, 140) : ""}`); };

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

async function call(session, path, { method = "GET", body, headers = {}, redirect = "manual", raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(session?.size() ? { cookie: session.header() } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  session?.absorb(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers, location: res.headers.get("location") || "" };
}

async function login(session, creds) {
  return call(session, "/api/v1/auth/login", { method: "POST", body: creds });
}

const iso = (d) => d.toISOString().slice(0, 10);
function nextWeekday(weekday, offsetWeeks = 0) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7 || 7) + offsetWeeks * 7); return iso(d); }
const noStack = (text) => !/\bat\s+\w+.*\(.*:\d+:\d+\)|node_modules|SELECT |INSERT INTO|postgres:\/\/|DATABASE_URL|SUPABASE_SECRET/i.test(text);

const anon = jar();
const admin = jar();
const doctor = jar();
const cleanup = { references: [], staffAuthId: null };

try {
  await pool.query("DELETE FROM rate_limits");

  // ---- 1. Anonymous access ------------------------------------------------------------
  let r = await call(anon, "/dashboard");
  check("anonymous → /dashboard redirects to login", [302, 303, 307, 308].includes(r.status) && r.location.includes("/dashboard/login"), `${r.status}`);
  r = await call(anon, "/dashboard/settings");
  check("anonymous → /dashboard/settings redirects to login", [302, 303, 307, 308].includes(r.status) && r.location.includes("/dashboard/login"));
  for (const p of ["/api/v1/appointments", "/api/v1/patients", "/api/v1/content", "/api/v1/settings", "/api/v1/availability", "/api/v1/auth/me"]) {
    r = await call(anon, p);
    check(`anonymous → GET ${p} → 401`, r.status === 401 && r.json?.error?.code === "UNAUTHORIZED", `${r.status}`);
  }
  for (const [p, method] of [["/api/v1/doctors", "POST"], ["/api/v1/services", "POST"], ["/api/v1/faqs", "POST"], ["/api/v1/settings/contact", "PUT"], ["/api/v1/content/home.hero", "PUT"], ["/api/v1/availability", "POST"]]) {
    r = await call(anon, p, { method, body: {} });
    check(`anonymous → ${method} ${p} → 401`, r.status === 401, `${r.status}`);
  }

  // ---- 2. Roles ------------------------------------------------------------------------
  r = await login(admin, ADMIN);
  check("admin signs in through Supabase Auth", r.status === 200 && r.json?.data?.user?.role === "admin", `${r.status}`);
  check("login response carries no token/secret", !/access_token|refresh_token|password|secret/i.test(r.text));
  r = await login(doctor, DOCTOR);
  check("doctor signs in", r.status === 200 && r.json?.data?.user?.role === "doctor" && r.json.data.user.doctorId, `${r.status}`);
  const doctorId = r.json?.data?.user?.doctorId;

  for (const [p, method, body] of [
    ["/api/v1/doctors", "POST", { name: "X", slug: "x", role: "Doctor" }],
    ["/api/v1/services", "POST", { name: "X", slug: "x", durationMinutes: 30 }],
    ["/api/v1/faqs", "POST", { key: "x", question: "Question?", answer: "Answer text here." }],
    ["/api/v1/settings/contact", "PUT", {}],
    ["/api/v1/content/home.hero", "PUT", {}],
    ["/api/v1/content", "GET"],
    ["/api/v1/settings", "GET"],
    ["/api/v1/testimonials?all=1", "GET"],
  ]) {
    r = await call(doctor, p, { method, body });
    check(`doctor → ${method} ${p} → 403`, r.status === 403, `${r.status}`);
  }
  const { rows: otherDoctors } = await pool.query("SELECT id FROM doctors WHERE id <> $1 AND is_active LIMIT 1", [doctorId]);
  const otherDoctorId = otherDoctors[0]?.id;
  r = await call(doctor, `/api/v1/appointments?doctorId=${otherDoctorId}`);
  check("doctor → another doctor's appointments → 403", r.status === 403, `${r.status}`);
  r = await call(doctor, `/api/v1/availability?doctorId=${otherDoctorId}`);
  check("doctor → another doctor's schedule → 403", r.status === 403, `${r.status}`);
  r = await call(doctor, "/api/v1/appointments");
  check("doctor → own appointments list is scoped", r.status === 200 && r.json.data.every((a) => a.doctor?.id === doctorId || a.doctorId === doctorId), `${r.json?.data?.length} rows`);
  const { rows: otherPatients } = await pool.query(
    "SELECT p.id FROM patients p WHERE NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = $1) LIMIT 1",
    [doctorId],
  );
  if (otherPatients[0]) {
    r = await call(doctor, `/api/v1/patients/${otherPatients[0].id}`);
    check("doctor → patient of another doctor → denied", r.status === 403 || r.status === 404, `${r.status}`);
  }

  // Temporary staff account (only when the Supabase secret key is available locally).
  if (process.env.SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const created = await supabaseAdmin.auth.admin.createUser({ email: STAFF.email, password: STAFF.password, email_confirm: true });
    if (created.data?.user) {
      cleanup.staffAuthId = created.data.user.id;
      await pool.query("INSERT INTO users (email, full_name, role, auth_user_id, is_active) VALUES ($1, 'Security Staff', 'staff', $2, TRUE) ON CONFLICT DO NOTHING", [STAFF.email, created.data.user.id]);
      const staff = jar();
      r = await login(staff, STAFF);
      check("staff signs in", r.status === 200 && r.json?.data?.user?.role === "staff", `${r.status}`);
      r = await call(staff, "/api/v1/appointments");
      check("staff → appointments list → 200", r.status === 200);
      for (const [p, method, body] of [["/api/v1/doctors", "POST", { name: "X", slug: "x", role: "Doctor" }], ["/api/v1/settings", "GET"], ["/api/v1/content", "GET"], ["/api/v1/faqs", "POST", { key: "x", question: "Question?", answer: "Answer text here." }]]) {
        r = await call(staff, p, { method, body });
        check(`staff → ${method} ${p} → 403`, r.status === 403, `${r.status}`);
      }
      r = await call(staff, "/dashboard/settings");
      check("staff → /dashboard/settings → denied redirect", [302, 303, 307, 308].includes(r.status) && r.location.includes("denied=1"), `${r.status} ${r.location}`);
    } else {
      check("staff account could be created for the test", false, created.error?.message || "unknown");
    }
  } else {
    console.log("SKIP  staff checks (SUPABASE_SECRET_KEY not available locally)");
  }

  // ---- 3. Input validation & safe errors ----------------------------------------------
  const { rows: [williams] } = await pool.query("SELECT d.id, (SELECT s.id FROM services s JOIN doctor_services ds ON ds.service_id = s.id WHERE ds.doctor_id = d.id AND s.is_active LIMIT 1) AS service_id FROM doctors d WHERE d.slug = 'dr-williams'");
  const monday = nextWeekday(1, 2);
  const patient = (n) => ({ fullName: `Security Test ${n}`, email: `security-${n}@example.com`, phone: "(213) 555-0180" });
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: "not-a-uuid", serviceId: williams.service_id, date: monday, time: "09:00", patient: patient(1) } });
  check("invalid doctor id → 422 validation (safe)", r.status === 422 && noStack(r.text), `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: "00000000-0000-4000-8000-000000000000", date: monday, time: "09:00", patient: patient(1) } });
  check("unknown service id → 422 validation (safe)", r.status === 422 && noStack(r.text), `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: williams.service_id, date: "2020-01-01", time: "09:00", patient: patient(1) } });
  check("past date → rejected", [409, 422].includes(r.status), `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: williams.service_id, date: monday, time: "25:99", patient: patient(1) } });
  check("impossible time → 422", r.status === 422, `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: williams.service_id, date: monday, time: "09:00", patient: { fullName: "A".repeat(500), email: "nope", phone: "1", notes: "x".repeat(5000) } } });
  check("oversized/malformed patient fields → 422", r.status === 422 && r.json?.error?.details, `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: "{not json" });
  check("malformed JSON → 400 (safe)", r.status === 400 && noStack(r.text), `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: "[]" });
  check("non-object body → 400", r.status === 400, `${r.status}`);
  r = await call(admin, "/api/v1/appointments/not-a-uuid");
  check("bad id on protected route → safe 4xx", r.status >= 400 && r.status < 500 && noStack(r.text), `${r.status}`);
  r = await call(admin, "/api/v1/appointments?page=999999&limit=999999");
  check("pagination bounds respected", r.status === 200 && r.json.meta.limit <= 100, `limit=${r.json?.meta?.limit}`);
  r = await call(admin, "/api/v1/appointments?search=%25%25%25");
  check("search with wildcards handled safely", r.status === 200, `${r.status}`);
  r = await call(admin, "/api/v1/doctors/00000000-0000-4000-8000-000000000000", { method: "PATCH", body: { isActive: true, role: "Doctor", secretField: 1 } });
  check("update of unknown doctor → 404 (no stack)", r.status === 404 && noStack(r.text), `${r.status}`);
  r = await call(admin, `/api/v1/doctors/${williams.id}`, { method: "PATCH", body: { id: "11111111-1111-4111-8111-111111111111", createdAt: "2000-01-01", unknownField: "x" } });
  check("mass assignment ignored (unknown fields dropped → nothing to update)", r.status === 422, `${r.status}`);

  // ---- 4. Double booking ---------------------------------------------------------------
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: williams.service_id, date: monday, time: "09:00", patient: patient(2) } });
  check("first booking → 201", r.status === 201, `${r.status}`);
  if (r.json?.data?.reference) cleanup.references.push(r.json.data.reference);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: { doctorId: williams.id, serviceId: williams.service_id, date: monday, time: "09:00", patient: patient(3) } });
  check("same slot again → 409 SLOT_UNAVAILABLE", r.status === 409 && r.json?.error?.code === "SLOT_UNAVAILABLE", `${r.status}`);
  check("booking response exposes no internal notes/ids of other patients", !/internalNotes|patient_id/i.test(r.text));

  // ---- 5. CSRF -------------------------------------------------------------------------
  const csrfBody = { doctorId: williams.id, serviceId: williams.service_id, date: monday, time: "10:00", patient: patient(4) };
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: csrfBody, headers: { origin: "https://evil.example" } });
  check("cross-origin Origin on mutation → 403 (clean JSON)", r.status === 403 && r.json?.error?.code === "FORBIDDEN" && noStack(r.text), `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: csrfBody, headers: { origin: "null" } });
  check("Origin: null → 403", r.status === 403, `${r.status}`);
  r = await call(anon, "/api/v1/appointments", { method: "POST", body: csrfBody, headers: { "sec-fetch-site": "cross-site" } });
  check("Sec-Fetch-Site: cross-site → 403", r.status === 403, `${r.status}`);
  r = await call(anon, "/api/v1/contact", { method: "POST", body: {}, headers: { referer: "https://evil.example/page" } });
  check("cross-origin Referer (no Origin) → 403", r.status === 403, `${r.status}`);
  r = await call(admin, "/api/v1/faqs", { method: "POST", body: { key: "csrf", question: "Question?", answer: "Answer text here." }, headers: { origin: "https://evil.example" } });
  check("authenticated admin mutation from foreign origin → 403", r.status === 403, `${r.status}`);
  r = await call(anon, "/api/v1/contact", { method: "POST", body: {}, headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" } });
  check("same-origin mutation passes CSRF (reaches validation)", r.status === 422, `${r.status}`);
  r = await call(anon, "/api/v1/faqs", { headers: { origin: "https://evil.example" } });
  check("cross-origin GET is not blocked", r.status === 200, `${r.status}`);

  // ---- 6. Rate limiting ----------------------------------------------------------------
  const contactBody = { fullName: "Rate Limit Test", email: "ratelimit@example.com", phone: "(213) 555-0181", topic: "general", message: "This is a rate limit test message." };
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const res = await call(anon, "/api/v1/contact", { method: "POST", body: contactBody });
    statuses.push(res.status);
    if (res.status === 429) { check("429 carries Retry-After", Boolean(res.headers.get("retry-after")), res.headers.get("retry-after")); check("429 body is clean", res.json?.error?.code === "RATE_LIMITED" && noStack(res.text)); break; }
  }
  check("contact form: 6th message in an hour → 429", statuses[5] === 429 || statuses.includes(429), statuses.join(","));
  const loginStatuses = [];
  for (let i = 0; i < 11; i++) {
    const res = await login(jar(), { email: "ratelimit-login@example.com", password: "wrong-password" });
    loginStatuses.push(res.status);
    if (res.status === 429) break;
  }
  check("login: repeated failures for one identity → 429", loginStatuses.includes(429), loginStatuses.join(","));
  await pool.query("DELETE FROM rate_limits");

  // ---- 7. Privacy: public output never contains patient data -----------------------------
  const { rows: patientRows } = await pool.query("SELECT email, full_name FROM patients LIMIT 50");
  const publicPages = ["/", "/doctors", "/doctors/dr-williams", "/services", "/faq", "/contact", "/appointments", "/sitemap.xml", "/api/v1/doctors", "/api/v1/services", "/api/v1/faqs"];
  let leaks = [];
  for (const p of publicPages) {
    const res = await call(anon, p);
    for (const pr of patientRows) {
      if (pr.email && res.text.toLowerCase().includes(pr.email.toLowerCase())) leaks.push(`${p}: ${pr.email}`);
      if (pr.full_name && pr.full_name.length > 6 && res.text.includes(pr.full_name)) leaks.push(`${p}: name`);
    }
  }
  check("no patient email/name appears in public pages, sitemap or public APIs", leaks.length === 0, leaks.slice(0, 3).join("; "));
  r = await call(anon, "/sitemap.xml");
  check("sitemap lists no dashboard/api/patient URLs", r.status === 200 && !/dashboard|\/api\/|patients|appointments\/[A-Z]/.test(r.text));
  r = await call(anon, "/robots.txt");
  check("robots disallows /dashboard and /api", /Disallow: \/dashboard/.test(r.text) && /Disallow: \/api\//.test(r.text));

  // ---- 8. Headers -----------------------------------------------------------------------
  const home = await call(anon, "/");
  const h = (name) => home.headers.get(name) || "";
  check("X-Content-Type-Options nosniff", h("x-content-type-options") === "nosniff");
  check("X-Frame-Options DENY", h("x-frame-options") === "DENY");
  check("Referrer-Policy set", h("referrer-policy").length > 0, h("referrer-policy"));
  check("Permissions-Policy set", h("permissions-policy").includes("camera=()"));
  check(expectProduction ? "CSP on public pages (no unsafe-eval)" : "CSP on public pages", h("content-security-policy").includes("default-src 'self'") && (!expectProduction || !h("content-security-policy").includes("unsafe-eval")), h("content-security-policy").slice(0, 80));
  if (expectProduction) check("HSTS present in production", (h("strict-transport-security") || "").includes("max-age="), h("strict-transport-security"));
  check("frame-ancestors 'none'", h("content-security-policy").includes("frame-ancestors 'none'"));
  const loginPage = await call(anon, "/dashboard/login");
  check("dashboard CSP uses a per-request nonce + strict-dynamic", /'nonce-[A-Za-z0-9+/=]+'/.test(loginPage.headers.get("content-security-policy") || "") && (loginPage.headers.get("content-security-policy") || "").includes("strict-dynamic"));
  check("dashboard is noindex", (loginPage.headers.get("x-robots-tag") || "").includes("noindex"));
  const apiRes = await call(anon, "/api/v1/faqs");
  check("API responses are no-store + noindex", (apiRes.headers.get("cache-control") || "").includes("no-store") && (apiRes.headers.get("x-robots-tag") || "").includes("noindex"));
  check("X-Powered-By removed", !home.headers.get("x-powered-by"));

  // ---- 9. Secrets never leave the server -----------------------------------------------
  const secrets = [process.env.SUPABASE_SECRET_KEY, process.env.DATABASE_URL, process.env.SEED_ADMIN_PASSWORD, process.env.SEED_DOCTOR_PASSWORD].filter(Boolean);
  const settings = await call(admin, "/api/v1/settings");
  const health = await call(anon, "/api/v1/health");
  const me = await call(admin, "/api/v1/auth/me");
  const bodies = [home.text, loginPage.text, settings.text, health.text, me.text];
  const exposed = secrets.some((s) => bodies.some((b) => b.includes(s)));
  check("no secret value appears in HTML/API bodies", !exposed);
  check("health endpoint is coarse (no driver/host/latency)", health.status === 200 && !/driver|latency|postgres|localhost/i.test(health.text), health.text.slice(0, 100));
  check("settings API returns clinic data only (no env/secret keys)", settings.status === 200 && !/SECRET|DATABASE_URL|password/i.test(settings.text));

  // ---- 10. Logout ------------------------------------------------------------------------
  r = await call(admin, "/api/v1/auth/logout", { method: "POST", body: {} });
  const after = await call(admin, "/api/v1/auth/me");
  check("logout → session invalid (401)", r.status === 200 && after.status === 401, `${after.status}`);
} finally {
  // Cleanup: test bookings/patients/messages, temp staff, rate-limit rows.
  for (const ref of cleanup.references) await pool.query("DELETE FROM appointments WHERE reference = $1", [ref]).catch(() => {});
  await pool.query("DELETE FROM notifications WHERE recipient_email LIKE 'security-%@example.com'").catch(() => {});
  await pool.query("DELETE FROM patients WHERE email LIKE 'security-%@example.com' AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = patients.id)").catch(() => {});
  await pool.query("DELETE FROM contact_messages WHERE email = 'ratelimit@example.com'").catch(() => {});
  await pool.query("DELETE FROM rate_limits").catch(() => {});
  if (cleanup.staffAuthId) {
    await pool.query("DELETE FROM users WHERE email = $1", [STAFF.email]).catch(() => {});
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await supabaseAdmin.auth.admin.deleteUser(cleanup.staffAuthId).catch(() => {});
  }
  await pool.end();
}

console.log(`\n${results.filter(Boolean).length}/${results.length} security checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);

// Availability engine + booking tests (no auth needed). Uses direct SQL for setup/teardown.
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { Pool } from "pg";

const BASE = "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };
const j = async (path, init) => { const r = await fetch(BASE + path, init); return { status: r.status, body: await r.json() }; };
const post = (path, body) => j(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const iso = (d) => d.toISOString().slice(0, 10);
function nextWeekday(weekday, offsetWeeks = 0) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7 || 7) + offsetWeeks * 7); return iso(d); }

const doctors = (await j("/api/v1/doctors")).body.data;
const services = (await j("/api/v1/services")).body.data;
const williams = doctors.find((d) => d.slug === "dr-williams");
const jones = doctors.find((d) => d.slug === "dr-jones");
const consult = services.find((s) => s.slug === "general-consultation");     // 30 min
const preventive = services.find((s) => s.slug === "preventive-health-screening"); // 45 min
const followup = services.find((s) => s.slug === "follow-up-care");           // 20 min

const monday = nextWeekday(1, 1); // a Monday next week (Williams: 09:00-12:30, 13:30-17:00)
const sunday = nextWeekday(0, 2); // Williams has no Sunday schedule (after the Monday above)
const wednesday = nextWeekday(3, 1); // Jones: 10:00-13:00, 14:00-18:00

// Clean any leftovers from previous runs on the test dates.
await pool.query("DELETE FROM appointments WHERE appointment_date IN ($1,$2,$3) AND patient_id IN (SELECT id FROM patients WHERE email LIKE 'avail-test-%')", [monday, sunday, wednesday]);
await pool.query("DELETE FROM schedule_exceptions WHERE reason LIKE 'avail-test%'");

// ---- Slot generation ---------------------------------------------------------
let r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
let slots = r.body.data.slots;
check("30-min service → 30-min slots, none in the 12:30-13:30 break", slots.every((s) => s.endTime !== "13:00") && slots.some((s) => s.startTime === "12:00" && s.endTime === "12:30") && !slots.some((s) => s.startTime === "13:00") && slots.some((s) => s.startTime === "13:30"), `${slots.length} slots, first ${slots[0]?.startTime}-${slots[0]?.endTime}`);
check("slots carry startTime/endTime/available", slots.every((s) => s.startTime && s.endTime && typeof s.available === "boolean"));

r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${preventive.id}&date=${monday}`);
const slots45 = r.body.data.slots;
check("45-min service → 45-min slots that fit the windows", r.body.data.slotMinutes === 45 && slots45.every((s) => { const [h1, m1] = s.startTime.split(":").map(Number); const [h2, m2] = s.endTime.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1) === 45; }) && !slots45.some((s) => s.startTime === "12:00"), `last morning start ${slots45.filter((s) => s.startTime < "13:00").at(-1)?.startTime}`);

r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${sunday}`);
check("no schedule on Sunday → empty with reason", r.body.data.slots.length === 0 && r.body.data.reason === "no-schedule");

r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=2020-01-01`);
check("past date → empty (outside window)", r.body.data.slots.length === 0 && r.body.data.reason === "outside-booking-window");

r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=not-a-date`);
check("invalid date → 400", r.status === 400);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&date=${monday}`);
check("missing service → 400", r.status === 400);
r = await j(`/api/v1/appointments/availability?doctor=${jones.id}&service=${preventive.id}&date=${wednesday}`);
check("service the doctor does not offer → 400", r.status === 400);

// ---- Exceptions -------------------------------------------------------------------
await pool.query("INSERT INTO schedule_exceptions (doctor_id, date, is_available, reason) VALUES ($1, $2, FALSE, 'avail-test whole day')", [williams.id, monday]);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
check("whole-day block → no slots, reason blocked", r.body.data.slots.length === 0 && r.body.data.reason === "blocked");
await pool.query("DELETE FROM schedule_exceptions WHERE reason = 'avail-test whole day'");

await pool.query("INSERT INTO schedule_exceptions (doctor_id, date, start_time, end_time, is_available, reason) VALUES ($1, $2, '09:00', '11:00', FALSE, 'avail-test range')", [williams.id, monday]);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
slots = r.body.data.slots;
check("time-range block 09:00-11:00 removes those slots only", !slots.some((s) => s.startTime < "11:00") && slots.some((s) => s.startTime === "11:00") && slots.some((s) => s.startTime === "13:30"));
await pool.query("DELETE FROM schedule_exceptions WHERE reason = 'avail-test range'");

await pool.query("INSERT INTO schedule_exceptions (doctor_id, date, start_time, end_time, is_available, reason) VALUES ($1, $2, '10:00', '12:00', TRUE, 'avail-test extra')", [williams.id, sunday]);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${sunday}`);
check("extra availability on a day off → slots appear 10:00-12:00 only", r.body.data.slots.length === 4 && r.body.data.slots[0].startTime === "10:00" && r.body.data.slots.at(-1).endTime === "12:00", `${r.body.data.slots.length} slots`);
await pool.query("DELETE FROM schedule_exceptions WHERE reason = 'avail-test extra'");

await pool.query("INSERT INTO schedule_exceptions (doctor_id, date, is_available, reason) VALUES (NULL, $1, FALSE, 'avail-test clinic closed')", [wednesday]);
r = await j(`/api/v1/appointments/availability?doctor=${jones.id}&service=${consult.id}&date=${wednesday}`);
check("clinic-wide blocked date applies to every doctor", r.body.data.slots.length === 0 && r.body.data.reason === "blocked");
r = await j(`/api/v1/appointments/availability/days?doctor=${jones.id}&service=${consult.id}&from=${wednesday}&to=${wednesday}`);
check("available-days endpoint excludes the blocked date", Array.isArray(r.body.data.days) && !r.body.data.days.includes(wednesday));
await pool.query("DELETE FROM schedule_exceptions WHERE reason = 'avail-test clinic closed'");

r = await j(`/api/v1/appointments/availability/days?doctor=${williams.id}&service=${consult.id}&from=${monday}&to=${sunday}`);
check("available-days lists working days and omits Sunday", r.body.data.days.includes(monday) && !r.body.data.days.includes(sunday), r.body.data.days.join(","));

// ---- Booking blocks slots; statuses --------------------------------------------------
const patient = (i) => ({ fullName: `Avail Tester ${i}`, email: `avail-test-${i}@example.com`, phone: "(213) 555-0150" });
r = await post("/api/v1/appointments", { doctorId: williams.id, serviceId: preventive.id, date: monday, time: "09:00", patient: patient(1) });
check("book 45-min at 09:00 → 201", r.status === 201, r.body?.data?.reference || JSON.stringify(r.body.error));
const ref1 = r.body.data?.reference;
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
slots = r.body.data.slots;
check("09:00 and 09:30 (overlapping the 45-min booking) now unavailable; 10:00 free", slots.find((s) => s.startTime === "09:00")?.available === false && slots.find((s) => s.startTime === "09:30")?.available === false && slots.find((s) => s.startTime === "10:00")?.available === true);

r = await post("/api/v1/appointments", { doctorId: williams.id, serviceId: consult.id, date: monday, time: "09:30", patient: patient(2) });
check("booking an overlapping slot → 409 SLOT_UNAVAILABLE", r.status === 409 && r.body.error.code === "SLOT_UNAVAILABLE", r.body.error?.message);

// cancel via SQL (dashboard cancel is tested with auth) → slot released
await pool.query("UPDATE appointments SET status = 'cancelled', cancelled_at = now() WHERE reference = $1", [ref1]);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
check("cancelled appointment releases the slot", r.body.data.slots.find((s) => s.startTime === "09:00")?.available === true);

// completed stays historical but does not block future (same date but marked completed)
await pool.query("UPDATE appointments SET status = 'completed', completed_at = now() WHERE reference = $1", [ref1]);
r = await j(`/api/v1/appointments/availability?doctor=${williams.id}&service=${consult.id}&date=${monday}`);
check("completed appointment does not block", r.body.data.slots.find((s) => s.startTime === "09:00")?.available === true);

// ---- Concurrency ---------------------------------------------------------------------
const statuses = await Promise.all(Array.from({ length: 6 }, (_, i) => fetch(`${BASE}/api/v1/appointments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doctorId: williams.id, serviceId: followup.id, date: monday, time: "14:00", patient: patient(10 + i) }) }).then((x) => x.status)));
check("6 simultaneous bookings for 14:00 → exactly one 201, rest 409", statuses.filter((s) => s === 201).length === 1 && statuses.filter((s) => s === 409).length === 5, statuses.join(","));
const { rows } = await pool.query("SELECT count(*)::int AS n FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = '14:00' AND status IN ('pending','confirmed','rescheduled')", [williams.id, monday]);
check("database holds exactly one active row for that slot", rows[0].n === 1);

// ---- Validation ----------------------------------------------------------------------
r = await post("/api/v1/appointments", { doctorId: williams.id, serviceId: consult.id, date: monday, time: "09:07", patient: patient(20) });
check("time not on the slot grid → 409 (not an offered slot)", r.status === 409);
r = await post("/api/v1/appointments", { doctorId: williams.id, serviceId: consult.id, date: sunday, time: "10:00", patient: patient(21) });
check("date with no schedule → 409", r.status === 409);
r = await post("/api/v1/appointments", { doctorId: williams.id, serviceId: consult.id, date: monday, time: "10:00", patient: { fullName: "", email: "x", phone: "1" } });
check("invalid patient fields → 422 with field errors", r.status === 422 && r.body.error.details.fullName && r.body.error.details.email && r.body.error.details.phone);

// cleanup test rows
await pool.query("DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE email LIKE 'avail-test-%')");
await pool.query("DELETE FROM patients WHERE email LIKE 'avail-test-%'");
await pool.end();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);

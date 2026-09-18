/**
 * Seed demo/development data.
 *
 *   npm run db:seed                      upsert catalogue + settings, create staff users if missing
 *   npm run db:seed -- --reset-passwords  also reset seeded users' passwords from env
 *
 * Content comes from the same structured demo data the site shipped with in
 * `data/` (doctor names/photos are the provided assets; everything marked demo
 * stays demo). Re-running is safe: catalogue rows are upserted by slug/key.
 *
 * Staff accounts (never hard-coded):
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD      admin account
 *   SEED_DOCTOR_EMAIL / SEED_DOCTOR_PASSWORD    login for Dr. Williams (role: doctor)
 * Identities are created in Supabase Auth through the server-side admin API
 * (requires SUPABASE_SECRET_KEY); the application `users` table only stores
 * the role mapping. Passwords are never written to the database or printed,
 * except a generated one shown once when no password variable is set.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { run } from "./cli.mjs";
import { doctors } from "../../data/doctors.js";
import { services } from "../../data/services.js";
import { faqs } from "../../data/faqs.js";
import { clinic } from "../../data/clinic.js";

const resetPasswords = process.argv.includes("--reset-passwords");

function generatedPassword(prefix) {
  return `${prefix}-${randomBytes(9).toString("base64url")}`;
}

async function seedDoctors(client) {
  const ids = new Map();
  for (const d of doctors) {
    const { rows } = await client.query(
      `INSERT INTO doctors (slug, name, title, role, role_is_demo, is_lead, location, photo_url, photo_alt, photo_position,
                            short_bio, bio, bio_is_demo, languages, accepting_new_patients, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, title = EXCLUDED.title, role = EXCLUDED.role, role_is_demo = EXCLUDED.role_is_demo,
         is_lead = EXCLUDED.is_lead, location = EXCLUDED.location, photo_url = EXCLUDED.photo_url,
         photo_alt = EXCLUDED.photo_alt, photo_position = EXCLUDED.photo_position, short_bio = EXCLUDED.short_bio,
         bio = EXCLUDED.bio, bio_is_demo = EXCLUDED.bio_is_demo, languages = EXCLUDED.languages,
         accepting_new_patients = EXCLUDED.accepting_new_patients, sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING id`,
      [
        d.slug, d.name, d.title, d.role, d.roleIsDemo, d.isLead, d.location, d.photo.src, d.photo.alt, d.photo.position,
        d.shortBio, d.bio, d.bioIsDemo, d.languages, d.acceptingNewPatients, d.sortOrder, d.isActive,
      ],
    );
    const id = rows[0].id;
    ids.set(d.slug, id);

    await client.query("DELETE FROM doctor_care_areas WHERE doctor_id = $1", [id]);
    for (const [index, label] of d.careAreas.entries()) {
      await client.query("INSERT INTO doctor_care_areas (doctor_id, label, sort_order) VALUES ($1, $2, $3)", [id, label, index]);
    }

    await client.query("DELETE FROM doctor_schedules WHERE doctor_id = $1", [id]);
    for (const day of d.schedule) {
      for (const block of day.blocks) {
        await client.query(
          "INSERT INTO doctor_schedules (doctor_id, weekday, start_time, end_time) VALUES ($1, $2, $3, $4)",
          [id, day.day, block.start, block.end],
        );
      }
    }
  }
  console.log(`  doctors: ${ids.size}`);
  return ids;
}

async function seedServices(client, doctorIds) {
  const ids = new Map();
  for (const s of services) {
    const { rows } = await client.query(
      `INSERT INTO services (slug, name, icon, duration_minutes, price_cents, short_description, description, highlights, is_demo, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, icon = EXCLUDED.icon, duration_minutes = EXCLUDED.duration_minutes,
         short_description = EXCLUDED.short_description, description = EXCLUDED.description,
         highlights = EXCLUDED.highlights, is_demo = EXCLUDED.is_demo, sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active
       RETURNING id`,
      [s.slug, s.name, s.icon, s.durationMinutes, s.priceCents ?? null, s.shortDescription, s.description, s.highlights, s.isDemo, s.sortOrder, s.isActive],
    );
    ids.set(s.slug, rows[0].id);
  }

  // Doctor <-> service links, from each doctor's serviceIds in the demo data.
  await client.query("DELETE FROM doctor_services WHERE doctor_id = ANY($1::uuid[])", [[...doctorIds.values()]]);
  let links = 0;
  for (const d of doctors) {
    for (const serviceSlug of d.serviceIds) {
      const serviceId = ids.get(serviceSlug);
      if (!serviceId) continue;
      await client.query("INSERT INTO doctor_services (doctor_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [doctorIds.get(d.slug), serviceId]);
      links += 1;
    }
  }
  console.log(`  services: ${ids.size} (${links} doctor links)`);
  return ids;
}

async function seedFaqs(client) {
  for (const f of faqs) {
    await client.query(
      `INSERT INTO faqs (key, category, question, answer, featured, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       ON CONFLICT (key) DO UPDATE SET
         category = EXCLUDED.category, question = EXCLUDED.question, answer = EXCLUDED.answer,
         featured = EXCLUDED.featured, sort_order = EXCLUDED.sort_order`,
      [f.id, f.category, f.question, f.answer, f.featured, f.sortOrder],
    );
  }
  console.log(`  faqs: ${faqs.length}`);
}

async function seedSettings(client) {
  const entries = {
    profile: {
      name: clinic.name,
      shortName: clinic.shortName,
      descriptor: clinic.descriptor,
      tagline: clinic.tagline,
      description: clinic.description,
      city: clinic.city,
      state: clinic.state,
      stateFull: clinic.stateFull,
      country: clinic.country,
      region: clinic.region,
      leadDoctorSlug: clinic.leadDoctorId,
    },
    address: clinic.address,
    contact: clinic.contact,
    hours: clinic.hours,
    social: clinic.social,
    notices: { emergencyNotice: clinic.emergencyNotice, medicalDisclaimer: clinic.medicalDisclaimer },
    booking: { maxDaysAhead: 90, minLeadMinutes: 60, slotStepMinutes: 30, defaultSlotMinutes: 30, timeZone: clinic.hours.timeZone },
  };
  for (const [key, value] of Object.entries(entries)) {
    await client.query(
      "INSERT INTO website_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, JSON.stringify(value)],
    );
  }
  console.log(`  website_settings: ${Object.keys(entries).length} keys`);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

async function findAuthUserByEmail(admin, email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Supabase listUsers failed: ${error.message}`);
    const match = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

/**
 * Ensure a Supabase Auth user exists for `email`. Returns { id, created, generated }.
 * With --reset-passwords the password from env (or a generated one) is applied
 * to an existing user; otherwise existing users are left untouched.
 */
async function ensureAuthUser(admin, { email, fullName, role, password }) {
  const existing = await findAuthUserByEmail(admin, email);
  let plain = password || null;
  let generated = null;
  if (!plain && (!existing || resetPasswords)) {
    generated = generatedPassword(role === "admin" ? "Admin" : "Doctor");
    plain = generated;
  }
  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: plain,
      email_confirm: true,
      user_metadata: { full_name: fullName, app_role: role },
    });
    if (error) throw new Error(`Supabase createUser failed for ${email}: ${error.message}`);
    return { id: data.user.id, created: true, generated };
  }
  if (resetPasswords) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password: plain, email_confirm: true });
    if (error) throw new Error(`Supabase updateUserById failed for ${email}: ${error.message}`);
    return { id: existing.id, created: false, generated, reset: true };
  }
  return { id: existing.id, created: false, generated: null };
}

async function upsertAppUser(client, { email, fullName, role, doctorId = null, authUserId = null }) {
  const existing = await client.query("SELECT id FROM users WHERE lower(email) = lower($1)", [email]);
  if (existing.rows.length) {
    await client.query(
      "UPDATE users SET full_name = $2, role = $3, doctor_id = $4, auth_user_id = COALESCE($5, auth_user_id), is_active = TRUE WHERE id = $1",
      [existing.rows[0].id, fullName, role, doctorId, authUserId],
    );
    return { created: false };
  }
  await client.query(
    "INSERT INTO users (email, full_name, role, doctor_id, auth_user_id, is_active) VALUES ($1, $2, $3, $4, $5, TRUE)",
    [email, fullName, role, doctorId, authUserId],
  );
  return { created: true };
}

async function seedUsers(client, doctorIds) {
  const admin = getSupabaseAdmin();
  const lead = doctors.find((d) => d.isLead) || doctors[0];
  const accounts = [
    {
      key: "admin",
      email: process.env.SEED_ADMIN_EMAIL || "admin@doctor-clinic-demo.com",
      fullName: "Clinic Administrator",
      role: "admin",
      doctorId: null,
      password: process.env.SEED_ADMIN_PASSWORD,
    },
    {
      key: "doctor",
      email: process.env.SEED_DOCTOR_EMAIL || `${lead.slug.replace(/^dr-/, "dr.")}@doctor-clinic-demo.com`,
      fullName: lead.name,
      role: "doctor",
      doctorId: doctorIds.get(lead.slug),
      password: process.env.SEED_DOCTOR_PASSWORD,
    },
  ];

  for (const account of accounts) {
    let authUserId = null;
    let authNote = "Supabase not configured (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY, then re-run db:seed)";
    let generated = null;
    if (admin) {
      const result = await ensureAuthUser(admin, account);
      authUserId = result.id;
      generated = result.generated;
      authNote = result.created ? "Supabase user created" : result.reset ? "Supabase password reset" : "Supabase user exists";
    }
    const app = await upsertAppUser(client, { ...account, authUserId });
    console.log(`  user ${account.key} <${account.email}>: role row ${app.created ? "created" : "updated"}; ${authNote}`);
    if (generated) {
      console.log(`
  ${account.key.toUpperCase()} PASSWORD (generated once, not stored anywhere else): ${generated}
`);
    }
  }
}

run("seed", async (pool) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doctorIds = await seedDoctors(client);
    await seedServices(client, doctorIds);
    await seedFaqs(client);
    await seedSettings(client);
    await seedUsers(client, doctorIds);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

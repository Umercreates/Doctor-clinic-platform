/**
 * Row -> domain object mappers. They produce the same shapes the UI used with
 * the bundled demo data, so components need no changes when the data source
 * is PostgreSQL.
 */

/** TIME columns come back as "HH:MM:SS"; the app uses "HH:MM". */
export function toHm(value) {
  if (!value) return null;
  return String(value).slice(0, 5);
}

/** DATE columns are configured to come back as "YYYY-MM-DD" strings (see pg type parser). */
export function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

/** Group flat schedule rows into [{ day, blocks: [{ start, end }] }]. */
export function groupSchedule(rows = []) {
  const byDay = new Map();
  for (const row of rows) {
    const day = Number(row.weekday);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push({ id: row.id, start: toHm(row.start_time), end: toHm(row.end_time) });
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, blocks]) => ({ day, blocks: blocks.sort((a, b) => a.start.localeCompare(b.start)) }));
}

export function toDoctor(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    role: row.role,
    roleIsDemo: row.role_is_demo,
    isLead: row.is_lead,
    location: row.location,
    photo: {
      src: row.photo_url,
      alt: row.photo_alt || `Portrait of ${row.name}`,
      position: row.photo_position || "50% 30%",
    },
    shortBio: row.short_bio,
    bio: row.bio || [],
    bioIsDemo: row.bio_is_demo,
    careAreas: row.care_areas || [],
    careAreasAreDemo: row.bio_is_demo,
    serviceIds: row.service_ids || [],
    languages: row.languages || [],
    schedule: groupSchedule(row.schedule_rows || []),
    scheduleIsDemo: false,
    acceptingNewPatients: row.accepting_new_patients,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toService(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents ?? null,
    shortDescription: row.short_description,
    description: row.description || [],
    highlights: row.highlights || [],
    doctorIds: row.doctor_ids || [],
    isDemo: row.is_demo,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toFaq(row) {
  return {
    id: row.key,
    uuid: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    featured: row.featured,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Patient record for dashboard use. Never includes anything beyond contact details. */
export function toPatient(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    appointmentCount: row.appointment_count !== undefined ? Number(row.appointment_count) : undefined,
    lastAppointmentDate: row.last_appointment_date ? toIso(row.last_appointment_date) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAppointment(row) {
  if (!row) return null;
  return {
    id: row.id,
    reference: row.reference,
    doctorId: row.doctor_id,
    serviceId: row.service_id,
    patientId: row.patient_id,
    date: toIso(row.appointment_date),
    time: toHm(row.start_time),
    endTime: toHm(row.end_time),
    durationMinutes: row.duration_minutes !== undefined ? Number(row.duration_minutes) : undefined,
    status: row.status,
    patientNotes: row.patient_notes,
    internalNotes: row.internal_notes,
    source: row.source,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at,
    rescheduledAt: row.rescheduled_at,
    rescheduledFrom: row.rescheduled_from_date ? { date: toIso(row.rescheduled_from_date), time: toHm(row.rescheduled_from_time) } : null,
    rescheduleCount: row.reschedule_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Optional joined summaries
    doctor: row.doctor_name ? { id: row.doctor_id, slug: row.doctor_slug, name: row.doctor_name, role: row.doctor_role } : undefined,
    service: row.service_name ? { id: row.service_id, slug: row.service_slug, name: row.service_name, durationMinutes: row.service_duration } : undefined,
    patient: row.patient_name ? { id: row.patient_id, fullName: row.patient_name, email: row.patient_email, phone: row.patient_phone } : undefined,
  };
}

/** Application user (profile + role). Credentials live in Supabase Auth, never here. */
export function toSafeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    authUserId: row.auth_user_id || null,
    email: row.email,
    name: row.full_name,
    role: row.role,
    doctorId: row.doctor_id || null,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

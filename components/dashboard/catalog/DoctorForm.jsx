"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ExternalLink, Save, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Checkbox, Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { validateDoctorInput } from "@/lib/validation/doctor";
import { api } from "@/lib/api";
import { dashboardRoutes, routes } from "@/lib/routes";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const splitLines = (text) => String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
const splitParagraphs = (text) => String(text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const splitCommas = (text) => String(text || "").split(",").map((l) => l.trim()).filter(Boolean);

function toForm(doctor) {
  return {
    name: doctor?.name || "",
    slug: doctor?.slug || "",
    title: doctor?.title || "",
    role: doctor?.role || "",
    roleIsDemo: doctor?.roleIsDemo ?? false,
    location: doctor?.location || "",
    photoUrl: doctor?.photo?.src && !doctor.photo.src.endsWith("placeholder.svg") ? doctor.photo.src : "",
    photoAlt: doctor?.photo?.alt || "",
    photoPosition: doctor?.photo?.position || "50% 30%",
    shortBio: doctor?.shortBio || "",
    bio: (doctor?.bio || []).join("\n\n"),
    bioIsDemo: doctor?.bioIsDemo ?? false,
    languages: (doctor?.languages || []).join(", "),
    careAreas: (doctor?.careAreas || []).join("\n"),
    serviceIds: doctor?.serviceIds || [],
    isLead: doctor?.isLead ?? false,
    acceptingNewPatients: doctor?.acceptingNewPatients ?? true,
    sortOrder: String(doctor?.sortOrder ?? 0),
  };
}

/**
 * Create / edit a doctor profile. Names, roles and biographies are entered by
 * staff; the form never invents credentials and lets staff flag placeholder
 * copy so the public site labels it as demo content.
 */
export function DoctorForm({ doctor = null, services = [] }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(doctor);
  const [form, setForm] = useState(() => toForm(doctor));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // "deactivate" | "reactivate"
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const set = (field) => (event) => {
    const next = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((f) => {
      const draft = { ...f, [field]: next };
      if (field === "name" && !slugTouched) draft.slug = slugify(next);
      return draft;
    });
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const toggleService = (id) => () => {
    setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((s) => s !== id) : [...f.serviceIds, id] }));
    setErrors((e) => ({ ...e, serviceIds: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug,
      title: form.title,
      role: form.role,
      roleIsDemo: form.roleIsDemo,
      location: form.location,
      photoUrl: form.photoUrl,
      photoAlt: form.photoAlt,
      photoPosition: form.photoPosition,
      shortBio: form.shortBio,
      bio: splitParagraphs(form.bio),
      bioIsDemo: form.bioIsDemo,
      languages: splitCommas(form.languages),
      careAreas: splitLines(form.careAreas),
      serviceIds: form.serviceIds,
      isLead: form.isLead,
      acceptingNewPatients: form.acceptingNewPatients,
      sortOrder: Number(form.sortOrder),
    };
    const validation = validateDoctorInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isEdit) {
        await api.updateDoctor(doctor.id, validation.value);
        toast.success("Doctor profile saved. The public site has been updated.");
        router.refresh();
      } else {
        const response = await api.createDoctor(validation.value);
        toast.success("Doctor added. Set their weekly hours next so patients can book.");
        router.push(`${dashboardRoutes.schedule}?doctor=${response.data.id}`);
      }
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save this doctor.");
    } finally {
      setBusy(false);
    }
  };

  const changeActive = async () => {
    setBusy(true);
    try {
      if (confirm === "deactivate") {
        await api.deactivateDoctor(doctor.id);
        toast.success("Doctor deactivated. They no longer appear on the website or in booking.");
      } else {
        await api.updateDoctor(doctor.id, { isActive: true });
        toast.success("Doctor reactivated.");
      }
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Could not update this doctor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {isEdit && !doctor.isActive && (
        <Alert tone="warning" title="This doctor is deactivated">
          The profile is hidden from the website and cannot be booked. Existing appointments are kept.
        </Alert>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="d-name" label="Full name" value={form.name} onChange={set("name")} error={errors.name} maxLength={100} required hint="As it should appear on the website, e.g. Dr. Williams." />
          <Input
            id="d-slug"
            label="URL slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug")(e);
            }}
            error={errors.slug}
            required
            hint={`Public address: /doctors/${form.slug || "…"}`}
          />
          <Input id="d-role" label="Role" value={form.role} onChange={set("role")} error={errors.role} maxLength={100} required hint="e.g. Primary Doctor. Only use verified titles." />
          <Input id="d-title" label="Credentials / title" value={form.title} onChange={set("title")} error={errors.title} maxLength={100} optional hint="Leave empty unless verified (e.g. MD)." />
          <Input id="d-location" label="Location" value={form.location} onChange={set("location")} error={errors.location} maxLength={150} optional />
          <Input id="d-languages" label="Languages" value={form.languages} onChange={set("languages")} error={errors.languages} optional hint="Comma separated." />
          <Input id="d-sort" label="Sort order" type="number" min={0} max={10000} value={form.sortOrder} onChange={set("sortOrder")} error={errors.sortOrder} />
          <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
            <Checkbox id="d-lead" label="Lead doctor" hint="Featured on the homepage and about page." checked={form.isLead} onChange={set("isLead")} />
            <Checkbox id="d-accepting" label="Accepting new patients" checked={form.acceptingNewPatients} onChange={set("acceptingNewPatients")} />
            <Checkbox id="d-roleDemo" label="Role is a placeholder" hint="Shows a demo label until verified." checked={form.roleIsDemo} onChange={set("roleIsDemo")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Photo</h2>
        <p className="mt-1 text-sm text-slate-600">Upload the image to <span className="font-mono">public/images/doctors/</span> and enter its path. A neutral placeholder is used when empty.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Input id="d-photo" label="Photo path" value={form.photoUrl} onChange={set("photoUrl")} error={errors.photoUrl} placeholder="/images/doctors/name.png" optional hint="Files served from this site only." />
          <Input id="d-photoAlt" label="Photo description (alt text)" value={form.photoAlt} onChange={set("photoAlt")} error={errors.photoAlt} maxLength={200} optional />
          <Input id="d-photoPos" label="Focal point" value={form.photoPosition} onChange={set("photoPosition")} error={errors.photoPosition} maxLength={30} hint="CSS object-position, e.g. 50% 30%." />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Biography & areas of care</h2>
        <div className="mt-5 grid gap-4">
          <Textarea id="d-shortBio" label="Short introduction" rows={2} value={form.shortBio} onChange={set("shortBio")} error={errors.shortBio} maxLength={300} optional hint={`${form.shortBio.length}/300 · shown on cards and in search results.`} />
          <Textarea id="d-bio" label="Biography" rows={6} value={form.bio} onChange={set("bio")} error={errors.bio} optional hint="Separate paragraphs with a blank line. Up to 10 paragraphs." />
          <Textarea id="d-care" label="Areas of care" rows={4} value={form.careAreas} onChange={set("careAreas")} error={errors.careAreas} optional hint="One per line, up to 20. Describe general areas (e.g. Preventive care), not clinical claims." />
          <Checkbox id="d-bioDemo" label="Biography is placeholder text" hint="Shows a demo label on the website until verified copy is supplied." checked={form.bioIsDemo} onChange={set("bioIsDemo")} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Services offered</h2>
        <p className="mt-1 text-sm text-slate-600">Patients can only book a doctor for the services ticked here.</p>
        {errors.serviceIds && (
          <p className="mt-2 text-xs font-medium text-rose-600" role="alert">
            {errors.serviceIds}
          </p>
        )}
        {services.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Checkbox key={service.id} id={`d-service-${service.id}`} label={service.name} hint={`${service.durationMinutes} min`} checked={form.serviceIds.includes(service.id)} onChange={toggleService(service.id)} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No active services yet. Create services first, then assign them here.</p>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {isEdit && (
            <>
              <Button type="button" variant="secondary" size="sm" leftIcon={CalendarClock} href={`${dashboardRoutes.schedule}?doctor=${doctor.id}`}>
                Weekly hours
              </Button>
              {doctor.isActive && (
                <Button type="button" variant="secondary" size="sm" rightIcon={ExternalLink} href={routes.doctor(doctor.slug)} target="_blank" rel="noopener noreferrer">
                  View public profile
                </Button>
              )}
              {doctor.isActive ? (
                <Button type="button" variant="ghost" size="sm" leftIcon={UserMinus} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirm("deactivate")} disabled={busy}>
                  Deactivate
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" leftIcon={UserPlus} onClick={() => setConfirm("reactivate")} disabled={busy}>
                  Reactivate
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2 sm:justify-end">
          <Button type="button" variant="secondary" href={dashboardRoutes.doctors} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={busy}>
            {isEdit ? "Save changes" : "Add doctor"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={changeActive}
        busy={busy}
        tone={confirm === "deactivate" ? "danger" : "primary"}
        title={confirm === "deactivate" ? `Deactivate ${doctor?.name}?` : `Reactivate ${doctor?.name}?`}
        description={
          confirm === "deactivate"
            ? "The profile is removed from the website and booking immediately. Existing appointments and records are kept, and you can reactivate later."
            : "The profile returns to the website and can be booked again."
        }
        confirmLabel={confirm === "deactivate" ? "Deactivate" : "Reactivate"}
        cancelLabel="Cancel"
      />
    </form>
  );
}

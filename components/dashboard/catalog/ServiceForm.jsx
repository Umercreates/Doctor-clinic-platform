"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { validateServiceInput } from "@/lib/validation/service";
import { api } from "@/lib/api";
import { dashboardRoutes, routes } from "@/lib/routes";

const ICON_OPTIONS = [
  "stethoscope",
  "heart-pulse",
  "clipboard-check",
  "calendar-check",
  "calendar-days",
  "bandage",
  "activity",
  "leaf",
  "video",
  "shield-check",
  "user-check",
  "heart",
  "message-circle",
  "clock",
].map((value) => ({ value, label: value }));

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const splitLines = (text) => String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
const splitParagraphs = (text) => String(text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function toForm(service) {
  return {
    name: service?.name || "",
    slug: service?.slug || "",
    icon: service?.icon || "stethoscope",
    durationMinutes: String(service?.durationMinutes ?? 30),
    price: service?.priceCents == null ? "" : (service.priceCents / 100).toFixed(2),
    shortDescription: service?.shortDescription || "",
    description: (service?.description || []).join("\n\n"),
    highlights: (service?.highlights || []).join("\n"),
    doctorIds: service?.allDoctorIds || service?.doctorIds || [],
    isDemo: service?.isDemo ?? false,
    sortOrder: String(service?.sortOrder ?? 0),
  };
}

/** Create / edit a service, including duration, optional price and the doctors who offer it. */
export function ServiceForm({ service = null, doctors = [] }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(service);
  const [form, setForm] = useState(() => toForm(service));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
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

  const toggleDoctor = (id) => () => {
    setForm((f) => ({ ...f, doctorIds: f.doctorIds.includes(id) ? f.doctorIds.filter((d) => d !== id) : [...f.doctorIds, id] }));
    setErrors((e) => ({ ...e, doctorIds: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const priceText = String(form.price).trim();
    const priceNumber = priceText === "" ? null : Number(priceText);
    if (priceNumber !== null && (!Number.isFinite(priceNumber) || priceNumber < 0)) {
      setErrors({ priceCents: "Enter a valid price or leave it empty." });
      setError("Please correct the highlighted fields.");
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug,
      icon: form.icon,
      durationMinutes: Number(form.durationMinutes),
      priceCents: priceNumber === null ? null : Math.round(priceNumber * 100),
      shortDescription: form.shortDescription,
      description: splitParagraphs(form.description),
      highlights: splitLines(form.highlights),
      doctorIds: form.doctorIds,
      isDemo: form.isDemo,
      sortOrder: Number(form.sortOrder),
    };
    const validation = validateServiceInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isEdit) {
        await api.updateService(service.id, validation.value);
        toast.success("Service saved. The public site has been updated.");
        router.refresh();
      } else {
        await api.createService(validation.value);
        toast.success("Service created.");
        router.push(dashboardRoutes.services);
      }
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save this service.");
    } finally {
      setBusy(false);
    }
  };

  const changeActive = async () => {
    setBusy(true);
    try {
      if (confirm === "deactivate") {
        await api.deactivateService(service.id);
        toast.success("Service deactivated. It no longer appears on the website or in booking.");
      } else {
        await api.updateService(service.id, { isActive: true });
        toast.success("Service reactivated.");
      }
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Could not update this service.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {isEdit && !service.isActive && (
        <Alert tone="warning" title="This service is deactivated">
          It is hidden from the website and cannot be booked. Existing appointments are kept.
        </Alert>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Service</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input id="s-name" label="Name" value={form.name} onChange={set("name")} error={errors.name} maxLength={100} required />
          <Input
            id="s-slug"
            label="URL slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug")(e);
            }}
            error={errors.slug}
            required
            hint={`Public address: /services/${form.slug || "…"}`}
          />
          <Input id="s-duration" label="Duration (minutes)" type="number" min={5} max={480} step={5} value={form.durationMinutes} onChange={set("durationMinutes")} error={errors.durationMinutes} required hint="Determines the appointment slot length." />
          <Input id="s-price" label="Price (USD)" type="number" min={0} step="0.01" value={form.price} onChange={set("price")} error={errors.priceCents} optional hint="Leave empty to show no price." />
          <div className="flex items-end gap-3">
            <Select id="s-icon" label="Icon" className="flex-1" value={form.icon} onChange={set("icon")} options={ICON_OPTIONS} error={errors.icon} />
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100" aria-hidden="true">
              <Icon name={form.icon} className="h-5 w-5" />
            </span>
          </div>
          <Input id="s-sort" label="Sort order" type="number" min={0} max={10000} value={form.sortOrder} onChange={set("sortOrder")} error={errors.sortOrder} />
          <Checkbox id="s-demo" label="Description is placeholder text" hint="Shows a demo label on the website until verified copy is supplied." checked={form.isDemo} onChange={set("isDemo")} className="md:col-span-2" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Description</h2>
        <div className="mt-5 grid gap-4">
          <Textarea id="s-short" label="Short description" rows={2} value={form.shortDescription} onChange={set("shortDescription")} error={errors.shortDescription} maxLength={300} optional hint={`${form.shortDescription.length}/300 · shown on cards and in search results.`} />
          <Textarea id="s-description" label="Full description" rows={6} value={form.description} onChange={set("description")} error={errors.description} optional hint="Separate paragraphs with a blank line. Up to 10 paragraphs." />
          <Textarea id="s-highlights" label="What's included" rows={4} value={form.highlights} onChange={set("highlights")} error={errors.highlights} optional hint="One item per line, up to 12." />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Doctors who offer this service</h2>
        <p className="mt-1 text-sm text-slate-600">Only ticked doctors can be booked for this service.</p>
        {errors.doctorIds && (
          <p className="mt-2 text-xs font-medium text-rose-600" role="alert">
            {errors.doctorIds}
          </p>
        )}
        {doctors.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Checkbox key={doctor.id} id={`s-doctor-${doctor.id}`} label={doctor.name} hint={doctor.isActive ? doctor.role : "Deactivated"} checked={form.doctorIds.includes(doctor.id)} onChange={toggleDoctor(doctor.id)} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No doctors yet. Add a doctor first, then assign them here.</p>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {isEdit && (
            <>
              {service.isActive && (
                <Button type="button" variant="secondary" size="sm" rightIcon={ExternalLink} href={routes.service(service.slug)} target="_blank" rel="noopener noreferrer">
                  View public page
                </Button>
              )}
              {service.isActive ? (
                <Button type="button" variant="ghost" size="sm" leftIcon={ToggleLeft} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirm("deactivate")} disabled={busy}>
                  Deactivate
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" leftIcon={ToggleRight} onClick={() => setConfirm("reactivate")} disabled={busy}>
                  Reactivate
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2 sm:justify-end">
          <Button type="button" variant="secondary" href={dashboardRoutes.services} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={busy}>
            {isEdit ? "Save changes" : "Create service"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={changeActive}
        busy={busy}
        tone={confirm === "deactivate" ? "danger" : "primary"}
        title={confirm === "deactivate" ? `Deactivate ${service?.name}?` : `Reactivate ${service?.name}?`}
        description={
          confirm === "deactivate"
            ? "The service is removed from the website and booking immediately. Existing appointments are kept, and you can reactivate later."
            : "The service returns to the website and can be booked again."
        }
        confirmLabel={confirm === "deactivate" ? "Deactivate" : "Reactivate"}
        cancelLabel="Cancel"
      />
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save } from "lucide-react";
import { Tabs, TabPanel } from "@/components/dashboard/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { validateSetting } from "@/lib/validation/settings";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";

const TABS = [
  { id: "profile", label: "Clinic profile" },
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "hours", label: "Opening hours" },
  { id: "social", label: "Social links" },
  { id: "notices", label: "Notices" },
  { id: "booking", label: "Booking rules" },
];

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function toForm(key, value) {
  const v = value || {};
  switch (key) {
    case "profile":
      return {
        name: v.name || "",
        shortName: v.shortName || "",
        descriptor: v.descriptor || "",
        tagline: v.tagline || "",
        description: v.description || "",
        city: v.city || "",
        state: v.state || "",
        stateFull: v.stateFull || "",
        country: v.country || "",
        region: v.region || "",
        leadDoctorSlug: v.leadDoctorSlug || "",
      };
    case "contact":
      return { phone: v.phone || "", email: v.email || "", fax: v.fax || "", isDemo: Boolean(v.isDemo) };
    case "address":
      return {
        line1: v.line1 || "",
        line2: v.line2 || "",
        city: v.city || "",
        state: v.state || "",
        postalCode: v.postalCode || "",
        country: v.country || "",
        mapQuery: v.mapQuery || "",
        isDemo: Boolean(v.isDemo),
      };
    case "hours": {
      const byDay = new Map((v.schedule || []).map((d) => [Number(d.day), d]));
      return {
        timeZone: v.timeZone || "America/Los_Angeles",
        isDemo: Boolean(v.isDemo),
        schedule: DAY_ORDER.map((day) => {
          const entry = byDay.get(day);
          return { day, closed: !entry?.open, open: entry?.open || "09:00", close: entry?.close || "17:00" };
        }),
      };
    }
    case "social": {
      const find = (id) => (v.links || []).find((l) => l.id === id)?.href || "";
      return { facebook: find("facebook") === "#" ? "" : find("facebook"), instagram: find("instagram") === "#" ? "" : find("instagram"), linkedin: find("linkedin") === "#" ? "" : find("linkedin"), isDemo: Boolean(v.isDemo) };
    }
    case "notices":
      return { emergencyNotice: v.emergencyNotice || "", medicalDisclaimer: v.medicalDisclaimer || "" };
    case "booking":
      return {
        maxDaysAhead: String(v.maxDaysAhead ?? 90),
        minLeadMinutes: String(v.minLeadMinutes ?? 60),
        slotStepMinutes: String(v.slotStepMinutes ?? 30),
        defaultSlotMinutes: String(v.defaultSlotMinutes ?? 30),
        timeZone: v.timeZone || "America/Los_Angeles",
      };
    default:
      return {};
  }
}

function toPayload(key, form) {
  if (key === "hours") {
    return {
      timeZone: form.timeZone,
      isDemo: form.isDemo,
      schedule: form.schedule.map((d) => ({ day: d.day, closed: d.closed, open: d.closed ? null : d.open, close: d.closed ? null : d.close })),
    };
  }
  if (key === "social") {
    return {
      isDemo: form.isDemo,
      links: ["facebook", "instagram", "linkedin"].map((id) => ({ id, href: form[id] || "#" })),
    };
  }
  return form;
}

/**
 * One settings group as a form. Validation mirrors the server (same module),
 * then the API stores the group and revalidates the public site.
 */
function SettingForm({ setting, doctors }) {
  const router = useRouter();
  const toast = useToast();
  const { key } = setting;
  const [form, setForm] = useState(() => toForm(key, setting.value));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (field) => (event) => {
    const next = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((f) => ({ ...f, [field]: next }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setDirty(true);
  };
  const setDay = (index, field) => (event) => {
    const next = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((f) => {
      const schedule = f.schedule.map((d, i) => (i === index ? { ...d, [field]: next } : d));
      return { ...f, schedule };
    });
    setErrors({});
    setDirty(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = toPayload(key, form);
    const validation = validateSetting(key, payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.updateSetting(key, validation.value);
      toast.success(`${TABS.find((t) => t.id === key)?.label} saved. The public site has been updated.`);
      setDirty(false);
      router.refresh();
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save these settings.");
    } finally {
      setBusy(false);
    }
  };

  const demoToggle = (hint) => (
    <Checkbox id={`${key}-isDemo`} label="These details are placeholders" hint={hint} checked={Boolean(form.isDemo)} onChange={set("isDemo")} className="md:col-span-2" />
  );

  let fields = null;
  if (key === "profile") {
    fields = (
      <>
        <Input id="p-name" label="Clinic name" value={form.name} onChange={set("name")} error={errors.name} maxLength={60} required />
        <Input id="p-short" label="Short name" value={form.shortName} onChange={set("shortName")} error={errors.shortName} maxLength={40} required hint="Used in the app manifest and tight spaces." />
        <Input id="p-descriptor" label="Descriptor" value={form.descriptor} onChange={set("descriptor")} error={errors.descriptor} maxLength={40} required hint="Shown under the logo, e.g. Medical Practice." />
        <Input id="p-tagline" label="Tagline" value={form.tagline} onChange={set("tagline")} error={errors.tagline} maxLength={120} required />
        <Textarea id="p-description" label="Description" className="md:col-span-2" rows={3} value={form.description} onChange={set("description")} error={errors.description} maxLength={400} required hint="Used for search-engine descriptions and social previews." />
        <Input id="p-city" label="City" value={form.city} onChange={set("city")} error={errors.city} maxLength={60} required />
        <Input id="p-region" label="Region" value={form.region} onChange={set("region")} error={errors.region} maxLength={60} optional />
        <Input id="p-state" label="State code" value={form.state} onChange={set("state")} error={errors.state} maxLength={5} required hint="e.g. CA" />
        <Input id="p-stateFull" label="State" value={form.stateFull} onChange={set("stateFull")} error={errors.stateFull} maxLength={40} required />
        <Input id="p-country" label="Country" value={form.country} onChange={set("country")} error={errors.country} maxLength={40} required />
        <Select
          id="p-lead"
          label="Lead doctor"
          value={form.leadDoctorSlug}
          onChange={set("leadDoctorSlug")}
          options={[{ value: "", label: "First doctor marked as lead" }, ...doctors.map((d) => ({ value: d.slug, label: d.name }))]}
          error={errors.leadDoctorSlug}
          hint="Featured on the homepage and in the copy tokens."
        />
      </>
    );
  } else if (key === "contact") {
    fields = (
      <>
        <Input id="c-phone" label="Phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
        <Input id="c-email" label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
        <Input id="c-fax" label="Fax" type="tel" value={form.fax} onChange={set("fax")} error={errors.fax} optional />
        {demoToggle("Keeps the demo label on the website and leaves phone/email out of search-engine data until verified.")}
      </>
    );
  } else if (key === "address") {
    fields = (
      <>
        <Input id="a-line1" label="Address line 1" value={form.line1} onChange={set("line1")} error={errors.line1} maxLength={120} required />
        <Input id="a-line2" label="Address line 2" value={form.line2} onChange={set("line2")} error={errors.line2} maxLength={120} optional />
        <Input id="a-city" label="City" value={form.city} onChange={set("city")} error={errors.city} maxLength={60} required />
        <Input id="a-state" label="State code" value={form.state} onChange={set("state")} error={errors.state} maxLength={5} required />
        <Input id="a-postal" label="Postal code" value={form.postalCode} onChange={set("postalCode")} error={errors.postalCode} maxLength={12} required />
        <Input id="a-country" label="Country" value={form.country} onChange={set("country")} error={errors.country} maxLength={40} required />
        <Input id="a-map" label="Map search text" className="md:col-span-2" value={form.mapQuery} onChange={set("mapQuery")} error={errors.mapQuery} maxLength={160} required hint="What the embedded map searches for, e.g. the full street address." />
        {demoToggle("Keeps the demo label on the website and leaves the street address out of search-engine data until verified.")}
      </>
    );
  } else if (key === "hours") {
    fields = (
      <>
        {errors.schedule && (
          <p className="text-xs font-medium text-rose-600 md:col-span-2" role="alert">
            {errors.schedule}
          </p>
        )}
        <div className="md:col-span-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {form.schedule.map((entry, index) => {
            const dayError = errors[`day${entry.day}`];
            return (
              <div key={entry.day} className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[8rem_1fr_1fr_auto]">
                <span className="text-sm font-medium text-slate-800">{DAY_LABELS[entry.day]}</span>
                <Input id={`h-open-${entry.day}`} label="Opens" type="time" step="900" value={entry.open} onChange={setDay(index, "open")} disabled={entry.closed} error={dayError} />
                <Input id={`h-close-${entry.day}`} label="Closes" type="time" step="900" value={entry.close} onChange={setDay(index, "close")} disabled={entry.closed} />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={entry.closed} onChange={setDay(index, "closed")} />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
        <Input id="h-tz" label="Time zone" value={form.timeZone} onChange={set("timeZone")} error={errors.timeZone} hint="IANA name, e.g. America/Los_Angeles" required />
        {demoToggle("Keeps the demo label next to opening hours and leaves them out of search-engine data until verified.")}
      </>
    );
  } else if (key === "social") {
    fields = (
      <>
        <Input id="s-facebook" label="Facebook" type="url" value={form.facebook} onChange={set("facebook")} error={errors.facebook} placeholder="https://facebook.com/…" optional />
        <Input id="s-instagram" label="Instagram" type="url" value={form.instagram} onChange={set("instagram")} error={errors.instagram} placeholder="https://instagram.com/…" optional />
        <Input id="s-linkedin" label="LinkedIn" type="url" value={form.linkedin} onChange={set("linkedin")} error={errors.linkedin} placeholder="https://linkedin.com/company/…" optional />
        <p className="text-xs text-slate-500 md:col-span-2">Leave a field empty to show a placeholder icon that goes nowhere.</p>
      </>
    );
  } else if (key === "notices") {
    fields = (
      <>
        <Textarea id="n-emergency" label="Emergency notice" className="md:col-span-2" rows={3} value={form.emergencyNotice} onChange={set("emergencyNotice")} error={errors.emergencyNotice} maxLength={400} required hint="Shown on the homepage, contact page and booking flow." />
        <Textarea id="n-disclaimer" label="Medical disclaimer" className="md:col-span-2" rows={4} value={form.medicalDisclaimer} onChange={set("medicalDisclaimer")} error={errors.medicalDisclaimer} maxLength={600} required hint="Shown in the footer and on the terms page." />
      </>
    );
  } else if (key === "booking") {
    fields = (
      <>
        <Input id="b-max" label="Booking window (days ahead)" type="number" min={1} max={365} value={form.maxDaysAhead} onChange={set("maxDaysAhead")} error={errors.maxDaysAhead} required />
        <Input id="b-lead" label="Same-day lead time (minutes)" type="number" min={0} max={1440} value={form.minLeadMinutes} onChange={set("minLeadMinutes")} error={errors.minLeadMinutes} required hint="Earliest a slot can start after the current time." />
        <Input id="b-step" label="Slot grid (minutes)" type="number" min={5} max={120} value={form.slotStepMinutes} onChange={set("slotStepMinutes")} error={errors.slotStepMinutes} required hint="Slot start times are offered on this grid." />
        <Input id="b-default" label="Default slot length (minutes)" type="number" min={5} max={240} value={form.defaultSlotMinutes} onChange={set("defaultSlotMinutes")} error={errors.defaultSlotMinutes} required hint="Used when a service has no duration." />
        <Input id="b-tz" label="Time zone" value={form.timeZone} onChange={set("timeZone")} error={errors.timeZone} required />
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-slate-500">{setting.isCustomized && setting.updatedAt ? `Last saved ${formatDateTime(setting.updatedAt)}` : "Using bundled defaults"}</p>
        <Badge variant={setting.isCustomized ? "brand" : "neutral"}>{setting.isCustomized ? "Customized" : "Default"}</Badge>
      </div>
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2">{fields}</div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setForm(toForm(key, setting.value));
            setErrors({});
            setError("");
            setDirty(false);
          }}
          disabled={busy || !dirty}
        >
          Discard changes
        </Button>
        <Button type="submit" size="sm" leftIcon={Save} loading={busy}>
          Save
        </Button>
      </div>
    </form>
  );
}

export function SettingsManager({ settings, doctors, initialTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => (TABS.some((t) => t.id === initialTab) ? initialTab : TABS[0].id));

  const changeTab = (next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={changeTab} />
      {settings.map((setting) => (
        <TabPanel key={setting.key} id={setting.key} active={tab === setting.key}>
          <SettingForm key={`${setting.key}-${setting.updatedAt || "default"}`} setting={setting} doctors={doctors} />
        </TabPanel>
      ))}
    </div>
  );
}

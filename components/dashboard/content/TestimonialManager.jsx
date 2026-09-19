"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/FormField";
import { DataTable } from "@/components/dashboard/DataTable";
import { useToast } from "@/components/ui/Toast";
import { validateTestimonialInput } from "@/lib/validation/testimonial";
import { api } from "@/lib/api";

function TestimonialDialog({ open, onClose, testimonial, doctors, onSaved }) {
  const isEdit = Boolean(testimonial);
  const [values, setValues] = useState({
    authorName: testimonial?.authorName || "",
    quote: testimonial?.quote || "",
    doctorId: testimonial?.doctorId || "",
    rating: testimonial?.rating ? String(testimonial.rating) : "",
    isPublished: testimonial?.isPublished ?? false,
    consentGiven: testimonial?.consentGiven ?? false,
    sortOrder: String(testimonial?.sortOrder ?? 0),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    const next = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((v) => ({ ...v, [field]: next }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...values,
      doctorId: values.doctorId || null,
      rating: values.rating === "" ? null : Number(values.rating),
      sortOrder: Number(values.sortOrder),
    };
    const validation = validateTestimonialInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = isEdit ? await api.updateTestimonial(testimonial.id, validation.value) : await api.createTestimonial(validation.value);
      onSaved(response.data, isEdit);
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save this testimonial.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={isEdit ? "Edit testimonial" : "Add a testimonial"}
      description="A testimonial only appears on the website when it is published and the patient's consent has been recorded."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="testimonial-form" loading={busy}>
            {isEdit ? "Save changes" : "Add testimonial"}
          </Button>
        </>
      }
    >
      <form id="testimonial-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="t-author" label="Patient name (as shown)" value={values.authorName} onChange={update("authorName")} error={errors.authorName} maxLength={80} required hint="First name or initials are fine." />
          <Select
            id="t-doctor"
            label="Doctor"
            value={values.doctorId}
            onChange={update("doctorId")}
            options={[{ value: "", label: "Not specified" }, ...doctors.map((d) => ({ value: d.id, label: d.name }))]}
            error={errors.doctorId}
          />
        </div>
        <Textarea id="t-quote" label="Quote" rows={4} value={values.quote} onChange={update("quote")} error={errors.quote} maxLength={600} required hint={`${values.quote.length}/600`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="t-rating"
            label="Rating"
            value={values.rating}
            onChange={update("rating")}
            options={[{ value: "", label: "No rating" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} / 5` }))]}
            error={errors.rating}
            hint="Kept for records only; ratings are never published as structured data."
          />
          <Input id="t-sort" label="Sort order" type="number" min={0} max={10000} value={values.sortOrder} onChange={update("sortOrder")} error={errors.sortOrder} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox id="t-consent" label="Consent recorded" hint="The patient agreed in writing to be quoted on the website." checked={values.consentGiven} onChange={update("consentGiven")} />
          <Checkbox id="t-published" label="Published" hint="Show on the homepage (requires consent)." checked={values.isPublished} onChange={update("isPublished")} />
        </div>
      </form>
    </Modal>
  );
}

/**
 * Testimonials management. Nothing is invented: staff record real quotes with
 * explicit consent, and only published + consented entries reach the site.
 */
export function TestimonialManager({ testimonials: initial, doctors }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [dialog, setDialog] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const onSaved = (saved, isEdit) => {
    setItems((list) => (isEdit ? list.map((t) => (t.id === saved.id ? saved : t)) : [...list, saved]));
    setDialog(null);
    toast.success(isEdit ? "Testimonial updated." : "Testimonial added.");
    router.refresh();
  };

  const remove = async () => {
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await api.deleteTestimonial(target.id);
      setItems((list) => list.filter((t) => t.id !== target.id));
      setPendingDelete(null);
      toast.success("Testimonial deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Could not delete this testimonial.");
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: "quote",
      label: "Testimonial",
      className: "whitespace-normal min-w-[18rem]",
      render: (row) => (
        <div>
          <p className="line-clamp-2 text-slate-800">“{row.quote}”</p>
          <p className="mt-1 text-xs text-slate-500">
            {row.authorName}
            {row.doctorName ? ` · ${row.doctorName}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Visibility",
      render: (row) => {
        const live = row.isPublished && row.consentGiven;
        return (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={live ? "success" : "warning"} dot>
              {live ? "Live on site" : row.isPublished ? "Awaiting consent" : "Draft"}
            </Badge>
            {row.consentGiven && <Badge variant="neutral">Consent recorded</Badge>}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setDialog({ testimonial: row })} disabled={busyId === row.id}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" leftIcon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setPendingDelete(row)} disabled={busyId === row.id}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{items.filter((t) => t.isPublished && t.consentGiven).length} live on the homepage. The section is hidden when there are none.</p>
        <Button size="sm" leftIcon={Plus} onClick={() => setDialog({ testimonial: null })}>
          Add testimonial
        </Button>
      </div>
      {sorted.length ? (
        <DataTable columns={columns} rows={sorted} caption="Patient testimonials" />
      ) : (
        <EmptyState title="No testimonials recorded" description="Add quotes from patients who have given written consent. Until then the homepage simply omits the section." action={<Button size="sm" leftIcon={Plus} onClick={() => setDialog({ testimonial: null })}>Add testimonial</Button>} />
      )}
      {dialog && <TestimonialDialog key={dialog.testimonial?.id || "new"} open onClose={() => setDialog(null)} testimonial={dialog.testimonial} doctors={doctors} onSaved={onSaved} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={Boolean(pendingDelete && busyId === pendingDelete.id)}
        title="Delete this testimonial?"
        description="It will be removed permanently from the records and the website."
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    </div>
  );
}

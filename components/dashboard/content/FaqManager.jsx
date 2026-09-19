"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/FormField";
import { DataTable } from "@/components/dashboard/DataTable";
import { useToast } from "@/components/ui/Toast";
import { FAQ_CATEGORIES, validateFaqInput } from "@/lib/validation/faq";
import { api } from "@/lib/api";

const CATEGORY_OPTIONS = FAQ_CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }));

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function FaqDialog({ open, onClose, faq, onSaved }) {
  const isEdit = Boolean(faq);
  const [values, setValues] = useState({
    key: faq?.key || "",
    question: faq?.question || "",
    answer: faq?.answer || "",
    category: faq?.category || "general",
    featured: faq?.featured ?? false,
    isActive: faq?.isActive ?? true,
    sortOrder: String(faq?.sortOrder ?? 0),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyTouched, setKeyTouched] = useState(isEdit);

  const update = (field) => (event) => {
    const next = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((v) => {
      const draft = { ...v, [field]: next };
      if (field === "question" && !keyTouched) draft.key = slugify(next);
      return draft;
    });
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...values, sortOrder: Number(values.sortOrder) };
    const validation = validateFaqInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = isEdit ? await api.updateFaq(faq.uuid, validation.value) : await api.createFaq(validation.value);
      onSaved(response.data, isEdit);
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save this question.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={isEdit ? "Edit question" : "Add a question"}
      description="Published questions appear on the FAQ page; featured ones also show on the homepage."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="faq-form" loading={busy}>
            {isEdit ? "Save changes" : "Add question"}
          </Button>
        </>
      }
    >
      <form id="faq-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Input id="faq-question" label="Question" value={values.question} onChange={update("question")} error={errors.question} maxLength={200} required />
        <Textarea id="faq-answer" label="Answer" rows={5} value={values.answer} onChange={update("answer")} error={errors.answer} maxLength={2000} required hint={`${values.answer.length}/2000`} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select id="faq-category" label="Category" value={values.category} onChange={update("category")} options={CATEGORY_OPTIONS} error={errors.category} required />
          <Input
            id="faq-key"
            label="Key"
            value={values.key}
            onChange={(e) => {
              setKeyTouched(true);
              update("key")(e);
            }}
            error={errors.key}
            hint="Lowercase letters, numbers and dashes."
            required
          />
          <Input id="faq-sort" label="Sort order" type="number" min={0} max={10000} value={values.sortOrder} onChange={update("sortOrder")} error={errors.sortOrder} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox id="faq-featured" label="Feature on homepage" hint="Shown in the FAQ preview on the homepage." checked={values.featured} onChange={update("featured")} />
          <Checkbox id="faq-active" label="Published" hint="Unpublished questions are hidden from visitors." checked={values.isActive} onChange={update("isActive")} />
        </div>
      </form>
    </Modal>
  );
}

/**
 * FAQ management: list, add, edit, publish/unpublish, feature and delete.
 * Every change revalidates the FAQ page and the homepage preview.
 */
export function FaqManager({ faqs: initialFaqs }) {
  const router = useRouter();
  const toast = useToast();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [dialog, setDialog] = useState(null); // { faq } | null
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const onSaved = (saved, isEdit) => {
    setFaqs((list) => (isEdit ? list.map((f) => (f.uuid === saved.uuid ? saved : f)) : [...list, saved]));
    setDialog(null);
    toast.success(isEdit ? "Question updated." : "Question added.");
    router.refresh();
  };

  const patch = async (faq, changes, message) => {
    setBusyId(faq.uuid);
    try {
      const response = await api.updateFaq(faq.uuid, changes);
      setFaqs((list) => list.map((f) => (f.uuid === faq.uuid ? response.data : f)));
      toast.success(message);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Could not update this question.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    const faq = pendingDelete;
    setBusyId(faq.uuid);
    try {
      await api.deleteFaq(faq.uuid);
      setFaqs((list) => list.filter((f) => f.uuid !== faq.uuid));
      setPendingDelete(null);
      toast.success("Question deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Could not delete this question.");
    } finally {
      setBusyId(null);
    }
  };

  const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question));

  const columns = [
    {
      key: "question",
      label: "Question",
      className: "whitespace-normal min-w-[18rem]",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.question}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.answer}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (row) => <Badge variant="neutral">{row.category}</Badge> },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={row.isActive ? "success" : "warning"} dot>
            {row.isActive ? "Published" : "Hidden"}
          </Badge>
          {row.featured && <Badge variant="brand">Featured</Badge>}
        </div>
      ),
    },
    { key: "sortOrder", label: "Order", className: "text-right", render: (row) => <span className="tabular-nums text-slate-600">{row.sortOrder}</span> },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" leftIcon={Star} onClick={() => patch(row, { featured: !row.featured }, row.featured ? "Removed from homepage." : "Featured on homepage.")} disabled={busyId === row.uuid} aria-label={row.featured ? "Unfeature" : "Feature"}>
            {row.featured ? "Unfeature" : "Feature"}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={row.isActive ? EyeOff : Eye} onClick={() => patch(row, { isActive: !row.isActive }, row.isActive ? "Question hidden." : "Question published.")} disabled={busyId === row.uuid}>
            {row.isActive ? "Hide" : "Publish"}
          </Button>
          <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setDialog({ faq: row })} disabled={busyId === row.uuid}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" leftIcon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setPendingDelete(row)} disabled={busyId === row.uuid}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {faqs.filter((f) => f.isActive).length} published · {faqs.filter((f) => f.featured && f.isActive).length} featured on the homepage
        </p>
        <Button size="sm" leftIcon={Plus} onClick={() => setDialog({ faq: null })}>
          Add question
        </Button>
      </div>
      {sorted.length ? (
        <DataTable columns={columns} rows={sorted} rowKey="uuid" caption="Frequently asked questions" />
      ) : (
        <EmptyState title="No questions yet" description="Add the questions patients ask most. They appear on the FAQ page as soon as they are published." action={<Button size="sm" leftIcon={Plus} onClick={() => setDialog({ faq: null })}>Add question</Button>} />
      )}
      {dialog && <FaqDialog key={dialog.faq?.uuid || "new"} open onClose={() => setDialog(null)} faq={dialog.faq} onSaved={onSaved} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={Boolean(pendingDelete && busyId === pendingDelete.uuid)}
        title="Delete this question?"
        description={pendingDelete ? `"${pendingDelete.question}" will be removed permanently. To hide it temporarily, use Hide instead.` : ""}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    </div>
  );
}

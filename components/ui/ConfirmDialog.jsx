"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

/**
 * Confirmation before a destructive or irreversible action.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Keep",
  tone = "danger",
  busy = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} loading={busy} className={tone === "danger" ? "bg-rose-600 shadow-none hover:bg-rose-700" : undefined}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function TriggerButton({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant: "primary" | "danger";
  onClick: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="button" size="sm" variant={variant} loading={pending} onClick={onClick}>
      {label}
    </Button>
  );
}

// Tombol submit server action yang minta konfirmasi dulu -- buat aksi
// admin yang gak bisa dibatalin (setujui/tolak) dari server component.
export function ConfirmSubmit({
  action,
  label,
  variant = "primary",
  title,
  description,
  confirmLabel,
}: {
  action: () => void | Promise<void>;
  label: string;
  variant?: "primary" | "danger";
  title: string;
  description: string;
  confirmLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action}>
      <TriggerButton label={label} variant={variant} onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        confirmVariant={variant}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          form.current?.requestSubmit();
        }}
      />
    </form>
  );
}

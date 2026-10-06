"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { freeChangeCoach, type FreeChangeState } from "./free-change-actions";

// Tombol pindah coach tanpa biaya, dengan konfirmasi (Hadi 3 Okt).
export function FreeChangeButton({ packageId, toCoachId, toPoolId, title, description }: { packageId: string; toCoachId: string; toPoolId: string; title: string; description: string }) {
  const [state, action, pending] = useActionState<FreeChangeState, FormData>(freeChangeCoach.bind(null, packageId, toCoachId, toPoolId), null);
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" loading={pending} onClick={() => setOpen(true)}>Pindah</Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel="Pindah Sekarang"
        confirmVariant="primary"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          form.current?.requestSubmit();
        }}
      />
      {state?.error && <p role="alert" className="text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

"use client";

import { useActionState, useRef, useState } from "react";
import { adminCancelBooking } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function AdminCancelButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(adminCancelBooking, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <Button type="button" variant="danger" size="sm" loading={pending} onClick={() => setOpen(true)}>
          Batalkan
        </Button>
      </form>
      {state?.error && (
        <p className="max-w-[180px] text-right text-xs text-danger-text">{state.error}</p>
      )}

      <ConfirmDialog
        open={open}
        title="Batalkan booking ini?"
        description="Sisa sesi member akan kembali, dan jatah pembatalan mandirinya berkurang."
        confirmLabel="Ya, batalkan"
        loading={pending}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { deleteAvailability } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function DeleteSlotButton({
  availabilityId,
  label,
}: {
  availabilityId: string;
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteAvailability.bind(null, availabilityId)}>
        <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
          Hapus
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        title={`Hapus slot ${label}?`}
        description="Slot ini gak bisa dibooking lagi kecuali dibuka ulang."
        confirmLabel="Ya, hapus"
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

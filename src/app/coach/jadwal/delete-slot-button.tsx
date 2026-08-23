"use client";

import { deleteAvailability } from "./actions";
import { Button } from "@/components/ui/button";

export default function DeleteSlotButton({
  availabilityId,
  label,
}: {
  availabilityId: string;
  label: string;
}) {
  return (
    <form
      action={deleteAvailability.bind(null, availabilityId)}
      onSubmit={(e) => {
        if (!confirm(`Hapus slot ${label}? Slot ini gak bisa dibooking lagi kecuali dibuka ulang.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        Hapus
      </Button>
    </form>
  );
}

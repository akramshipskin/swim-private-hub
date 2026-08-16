"use client";

import { useActionState } from "react";
import { adminCancelBooking } from "./actions";
import { Button } from "@/components/ui/button";

export default function AdminCancelButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(adminCancelBooking, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <Button type="submit" variant="danger" size="sm" loading={pending}>
          Batalkan
        </Button>
      </form>
      {state?.error && (
        <p className="max-w-[180px] text-right text-xs text-danger-text">{state.error}</p>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { Button } from "@/components/ui/button";

export default function AttendanceToggle({
  bookingId,
  attended,
}: {
  bookingId: string;
  attended: boolean | null;
}) {
  const [state, formAction, pending] = useActionState(markAttendance, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="attended" value="true" />
          <Button
            type="submit"
            size="sm"
            variant={attended === true ? "primary" : "secondary"}
            loading={pending}
          >
            Hadir
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="attended" value="false" />
          <Button
            type="submit"
            size="sm"
            variant={attended === false ? "danger" : "secondary"}
            loading={pending}
          >
            Gak Hadir
          </Button>
        </form>
      </div>
      {state?.error && <p className="text-xs text-danger-text">{state.error}</p>}
    </div>
  );
}

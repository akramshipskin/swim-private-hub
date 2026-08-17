"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { Button } from "@/components/ui/button";

// Begitu attended udah ditandai (bukan null), tombol kekunci -- coach/admin
// harus klik "Edit" dulu buat ganti. Sebelumnya kedua tombol Hadir/Gak
// Hadir selalu aktif jadi gampang ke-klik gak sengaja abis nandain.
export default function AttendanceToggle({
  bookingId,
  attended,
}: {
  bookingId: string;
  attended: boolean | null;
}) {
  const [state, formAction, pending] = useActionState(markAttendance, null);
  const [isEditing, setIsEditing] = useState(attended === null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const locked = attended !== null && !isEditing;

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
            disabled={locked}
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
            disabled={locked}
          >
            Gak Hadir
          </Button>
        </form>
        {locked && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {state?.error && <p className="text-xs text-danger-text">{state.error}</p>}
    </div>
  );
}

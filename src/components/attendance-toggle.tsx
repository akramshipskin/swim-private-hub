"use client";

import { useActionState, useRef } from "react";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";

// Dropdown compact -- cuma nunjukin status yang lagi kepilih, bukan 2
// tombol Hadir/Gak Hadir + tombol Edit sekaligus. Ganti pilihan langsung
// submit (gak butuh tombol Simpan terpisah), jadi kartu booking gak
// makan tempat horizontal cuma buat nandain kehadiran.
export default function AttendanceToggle({
  bookingId,
  attended,
}: {
  bookingId: string;
  attended: boolean | null;
}) {
  const [state, formAction, pending] = useActionState(markAttendance, null);
  const formRef = useRef<HTMLFormElement>(null);

  const toneClass =
    attended === true
      ? "border-success-text/25 bg-success-bg text-success-text"
      : attended === false
        ? "border-danger-text/25 bg-danger-bg text-danger-text"
        : "border-border bg-white text-text-muted";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        name="attended"
        defaultValue={attended === null ? "" : String(attended)}
        disabled={pending}
        onChange={(e) => {
          if (e.target.value) formRef.current?.requestSubmit();
        }}
        aria-label="Status kehadiran"
        className={`rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 ${toneClass}`}
      >
        <option value="" disabled>
          Belum ditandai
        </option>
        <option value="true">Hadir</option>
        <option value="false">Gak Hadir</option>
      </select>
      {state?.error && <p className="max-w-[140px] text-right text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

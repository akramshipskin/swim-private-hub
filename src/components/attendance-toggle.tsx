"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";

// Dropdown compact -- cuma nunjukin status yang lagi kepilih, bukan 2
// tombol Hadir/Gak Hadir + tombol Edit sekaligus. Ganti pilihan langsung
// submit (gak butuh tombol Simpan terpisah), jadi kartu booking gak
// makan tempat horizontal cuma buat nandain kehadiran.
//
// Controlled (bukan defaultValue) + optimistic local state -- select
// native gak butuh ini buat nunjukin teks yang baru dipilih, tapi warna
// border/bg-nya (toneClass) butuh, dan defaultValue gak pernah re-apply
// abis mount walau prop attended berubah dari server. router.refresh()
// abis submit sukses jadi jaring pengaman biar data lain yang nurunin
// dari attended (misal total sesi valid) ikut sinkron juga.
export default function AttendanceToggle({
  bookingId,
  attended,
}: {
  bookingId: string;
  attended: boolean | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(markAttendance, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [localAttended, setLocalAttended] = useState(attended);
  const wasPending = useRef(false);

  useEffect(() => {
    setLocalAttended(attended);
  }, [attended]);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state?.error) {
        setLocalAttended(attended);
      } else {
        router.refresh();
      }
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const toneClass =
    localAttended === true
      ? "border-success-text/25 bg-success-bg text-success-text"
      : localAttended === false
        ? "border-danger-text/25 bg-danger-bg text-danger-text"
        : "border-border bg-white text-text-muted";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="attended" value={localAttended === null ? "" : String(localAttended)} />
      <select
        value={localAttended === null ? "" : String(localAttended)}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          setLocalAttended(v === "true" ? true : v === "false" ? false : null);
          if (v) requestAnimationFrame(() => formRef.current?.requestSubmit());
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

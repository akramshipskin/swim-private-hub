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
        : "border-border bg-surface text-text-muted";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="attended" value={localAttended === null ? "" : String(localAttended)} />
      {/* appearance-none + chevron manual -- native <select> pake OS
          chrome-nya sendiri (paling kentara di iOS), gak konsisten sama
          dropdown lain di app ini yang udah dibikin gitu juga. */}
      <div className="relative inline-block">
        <select
          value={localAttended === null ? "" : String(localAttended)}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value;
            setLocalAttended(v === "true" ? true : v === "false" ? false : null);
            if (v) requestAnimationFrame(() => formRef.current?.requestSubmit());
          }}
          aria-label="Status kehadiran"
          className={`appearance-none rounded-lg border py-1 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 ${toneClass}`}
        >
          <option value="" disabled>
            Belum ditandai
          </option>
          <option value="true">Hadir</option>
          <option value="false">Tidak Hadir</option>
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {state?.error && <p className="max-w-[140px] text-right text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { reportAttendance } from "./actions";
import { Button } from "@/components/ui/button";

// Tombol "Laporkan" hanya muncul di sesi berstatus Tidak Hadir yang masih
// dalam batas waktu melapor (dicek juga di server).
export default function ReportButton({ bookingId, deadlineLabel }: { bookingId: string; deadlineLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportAttendance, null);

  if (state?.ok) {
    return <p className="text-xs text-text-muted">Laporan terkirim. Admin akan memeriksanya.</p>;
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Laporkan
        </Button>
        <p className="text-xs text-text-subtle">Sebenarnya hadir? Lapor s.d. {deadlineLabel}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-56 flex-col gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="text-xs font-medium text-text" htmlFor={`note-${bookingId}`}>
        Ceritakan Singkat (Opsional)
      </label>
      <textarea
        id={`note-${bookingId}`}
        name="note"
        maxLength={500}
        rows={3}
        placeholder="Contoh: anak saya datang dan les sampai selesai"
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          Kirim Laporan
        </Button>
      </div>
      {state?.error && <p role="alert" className="text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

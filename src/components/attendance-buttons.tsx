"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Dua tombol Hadir / Tidak hadir untuk satu sesi di dasbor coach. Memakai aksi
// yang sama dengan menu pilihan di Riwayat Sesi (aturan 24 jam dan pembukuan
// dijaga server). Tiap ketukan minta konfirmasi dulu karena menandai langsung
// mengkredit saldo; mengubahnya lagi bisa dari Riwayat Sesi.
export default function AttendanceButtons({
  bookingId,
  lockedReason,
}: {
  bookingId: string;
  lockedReason?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(markAttendance, null);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [value, setValue] = useState<boolean | null>(null);
  const [toConfirm, setToConfirm] = useState<boolean | null>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) router.refresh();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (lockedReason)
    return <p className="text-xs text-text-subtle">{lockedReason}</p>;

  // Dialog konfirmasi di LUAR <form>: tombol di dalamnya tanpa type="button"
  // akan ikut mengirim form (Batal bisa tercatat sebagai Tidak hadir).
  return (
    <>
      <form ref={formRef} action={formAction} className="flex flex-col gap-1">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="attended" value={String(value)} />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setToConfirm(true)}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-fixed-ink-deep disabled:opacity-60"
          >
            Hadir
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setToConfirm(false)}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            Tidak hadir
          </button>
        </div>
        {state?.error && !pending && (
          <p className="text-xs text-danger-text">{state.error}</p>
        )}
      </form>
      <ConfirmDialog
        open={toConfirm !== null}
        title={toConfirm ? "Tandai Hadir?" : "Tandai Tidak Hadir?"}
        description={
          toConfirm
            ? "Bagi hasil sesi ini langsung masuk ke saldo kolam, coach, dan SPH. Bisa diubah lagi dari Riwayat Sesi."
            : "Sesi ini dianggap hangus dan bagi hasil Tidak Hadir langsung masuk ke saldo. Mengubahnya lagi nanti akan membalik pembukuannya."
        }
        confirmLabel={toConfirm ? "Ya, tandai Hadir" : "Ya, tandai Tidak Hadir"}
        confirmVariant="primary"
        onCancel={() => setToConfirm(null)}
        onConfirm={() => {
          setValue(toConfirm);
          setToConfirm(null);
          requestAnimationFrame(() => formRef.current?.requestSubmit());
        }}
      />
    </>
  );
}

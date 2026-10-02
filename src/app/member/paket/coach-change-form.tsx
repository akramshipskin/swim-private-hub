"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { requestCoachChange } from "./coach-change-actions";
import { MIN_REASON_LENGTH } from "@/lib/coach-change-rules";

type Option = { id: string; name: string; note: string };

// Pengajuan ganti coach (Hadi 2 Okt): alasan wajib, diputuskan admin.
export function CoachChangeForm({ packageId, coaches }: { packageId: string; coaches: Option[] }) {
  const [state, action, pending] = useActionState(requestCoachChange, null);
  const [open, setOpen] = useState(false);
  if (state?.ok) return <p className="text-sm text-success-text">Pengajuan terkirim. Admin akan memeriksa alasannya.</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
        Ajukan ganti coach
      </button>
    );
  }
  return (
    <form action={action} className="mt-2 flex flex-col gap-3 rounded-xl bg-surface-muted p-3">
      <input type="hidden" name="packageId" value={packageId} />
      <p className="text-xs text-text-muted">
        Ganti coach hanya untuk alasan yang jelas (kecocokan atau masalah pribadi), di kolam yang sama, dan diputuskan admin.
        Sisa sesi dihitung ulang dengan harga coach baru: lebih murah = selisih masuk saldomu, lebih mahal = tambah bayar dalam 24 jam.
      </p>
      <Field label="Coach pengganti">
        <Select name="toCoachId" required defaultValue="">
          <option value="" disabled>
            Pilih coach
          </option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.note}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Alasan">
        <Textarea name="reason" rows={3} required minLength={MIN_REASON_LENGTH} maxLength={500} placeholder="Ceritakan alasannya untuk admin" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          Kirim pengajuan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Batal
        </Button>
      </div>
      {state?.error && <p className="text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

export function PayDifferenceButton({ requestId, label }: { requestId: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/coach-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Gagal memulai pembayaran. Coba lagi.");
        setLoading(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Koneksi terputus. Periksa internet, lalu coba lagi.");
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={pay} loading={loading}>
        {label}
      </Button>
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}

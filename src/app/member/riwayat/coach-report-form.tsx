"use client";

import { useActionState, useState } from "react";
import { reportCoach } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

// Lapor coach (Hadi 10-11 Okt). Laporan hanya dibaca admin; coach tidak tahu siapa pelapornya.
export default function CoachReportForm({ coaches }: { coaches: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(reportCoach, null);
  const [open, setOpen] = useState(false);
  if (coaches.length === 0) return null;
  return (
    <Card className="mt-8">
      <CardBody className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Laporkan Coach</h2>
          <p className="text-sm text-text-muted">
            Coach menawarkan les atau meminta pembayaran di luar aplikasi, membagikan nomor pribadi, atau ada hal lain yang tidak
            sesuai? Laporanmu hanya dibaca admin SPH.
          </p>
        </div>
        {state?.ok ? (
          <p role="status" className="text-sm text-success-text">Laporan terkirim. Admin akan memeriksanya dan menghubungimu bila perlu.</p>
        ) : !open ? (
          <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setOpen(true)}>
            Buat Laporan
          </Button>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <Field label="Coach">
              <Select name="coachId" required defaultValue="">
                <option value="" disabled>Pilih coach</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Kejadiannya">
              <Textarea name="message" rows={4} required minLength={10} maxLength={1000} placeholder="Ceritakan apa yang terjadi dan kapan." />
            </Field>
            <Field label="Tangkapan Layar (Opsional)">
              <input name="attachment" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm text-text-muted" />
            </Field>
            {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={pending}>Kirim Laporan</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Batal</Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
import { resolveReport } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default function ResolveForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(resolveReport, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <Textarea
        name="resolution"
        required
        minLength={3}
        maxLength={500}
        rows={2}
        aria-label="Hasil pemeriksaan"
        placeholder="Hasil pemeriksaan, tampil ke member. Contoh: sudah dicek dengan coach, status diubah menjadi Hadir."
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>Tutup Laporan</Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
      </div>
    </form>
  );
}

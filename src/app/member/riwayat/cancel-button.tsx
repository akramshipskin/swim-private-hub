"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function CancelButton({
  bookingId,
  label,
}: {
  bookingId: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/booking/${bookingId}`, { method: "DELETE" });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      setOpen(false);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Batalkan
      </Button>
      {error && <p className="max-w-[180px] text-right text-xs text-danger-text">{error}</p>}

      <ConfirmDialog
        open={open}
        title="Batalkan booking ini?"
        description={`${label}. Kuota sesi kamu bakal balik, tapi jatah pembatalan mandiri berkurang.`}
        confirmLabel="Ya, batalkan"
        loading={loading}
        onConfirm={handleCancel}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

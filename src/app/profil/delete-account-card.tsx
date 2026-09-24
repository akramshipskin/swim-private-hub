"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelDeletionAction, requestDeletionAction } from "./account-deletion-actions";

export default function DeleteAccountCard({ requestedAt }: { requestedAt: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string } | null>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
      setOpen(false);
    });
  }

  return (
    <Card>
      <CardBody>
        <h2 className="mb-1 text-lg font-semibold text-text">Hapus akun</h2>
        {requestedAt ? (
          <>
            <p className="text-sm text-text-muted">
              Permintaan hapus akun dikirim{" "}
              {new Date(requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}
              . Admin akan memprosesnya; setelah itu kamu tidak bisa masuk lagi.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" loading={pending} onClick={() => run(cancelDeletionAction)}>
              Batalkan permintaan
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              Nama, nomor HP, email, dan nama peserta akan dihapus setelah disetujui admin. Sisa sesi paket ikut hangus
              dan jadwal yang belum berjalan dibatalkan. Riwayat transaksi tetap disimpan tanpa identitasmu.
            </p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Minta hapus akun
            </Button>
          </>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-danger-text">{error}</p>}
      </CardBody>
      <ConfirmDialog
        open={open}
        title="Minta hapus akun?"
        description="Permintaan dikirim ke admin. Selama belum diproses, kamu masih bisa membatalkannya dari halaman ini."
        confirmLabel="Ya, minta hapus"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => run(requestDeletionAction)}
      />
    </Card>
  );
}

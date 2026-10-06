"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelDeletionAction, requestDeletionAction } from "./account-deletion-actions";
import { formatRupiah } from "@/lib/format";

export default function DeleteAccountCard({ requestedAt, memberBalance }: { requestedAt: string | null; memberBalance: number }) {
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
              Pengajuan hapus akun dikirim{" "}
              {new Date(requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}
              . Admin akan memprosesnya; setelah itu kamu tidak bisa masuk lagi.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" loading={pending} onClick={() => run(cancelDeletionAction)}>
              Batalkan Pengajuan
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              Nama, nomor HP, email, dan nama peserta akan dihapus setelah disetujui admin. Sisa sesi paket ikut hangus
              dan jadwal yang belum berjalan dibatalkan. Riwayat transaksi tetap disimpan tanpa identitasmu.
            </p>
            {memberBalance > 0 && (
              <p className="mt-2 text-sm text-text">
                Kamu masih punya saldo <b>{formatRupiah(memberBalance)}</b>. Pakai lebih dulu untuk membeli paket, atau minta
                bantuan admin memakainya sebelum akun ditutup. Sisa saldo hangus saat akun dihapus.
              </p>
            )}
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Minta Hapus Akun
            </Button>
          </>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-danger-text">{error}</p>}
      </CardBody>
      <ConfirmDialog
        open={open}
        title="Minta hapus akun?"
        description="Pengajuan dikirim ke admin. Selama belum diproses, kamu masih bisa membatalkannya dari halaman ini."
        confirmLabel="Ya, Minta Hapus"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => run(requestDeletionAction)}
      />
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { anonymizeMemberAction } from "../account-deletion-actions";

export default function AnonymizeCard({
  userId,
  requestedAt,
  upcomingBookings,
  remainingSessions,
}: {
  userId: string;
  requestedAt: string;
  upcomingBookings: number;
  remainingSessions: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function approve() {
    startTransition(async () => {
      const res = await anonymizeMemberAction(userId);
      setOpen(false);
      setMessage(res.error ?? `Akun dihapus. ${res.cancelledBookings ?? 0} jadwal dibatalkan.`);
    });
  }

  return (
    <Card className="border-danger-text/30">
      <CardBody>
        <h2 className="mb-1 text-lg font-semibold text-text">Permintaan hapus akun</h2>
        <p className="text-sm text-text-muted">
          Diajukan member pada{" "}
          {new Date(requestedAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
          . Menyetujui = nama, HP, email, nama peserta dihapus; akun tidak bisa masuk lagi. Riwayat transaksi & arsip chat
          tetap ada.
        </p>
        <p className="mt-2 text-sm text-text">
          Ikut terdampak: <b>{upcomingBookings}</b> jadwal mendatang dibatalkan, <b>{remainingSessions}</b> sisa sesi paket hangus.
        </p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => setOpen(true)}>
          Setujui &amp; hapus data
        </Button>
        {message && <p role="status" className="mt-2 text-sm text-text">{message}</p>}
      </CardBody>
      <ConfirmDialog
        open={open}
        title="Hapus data akun ini?"
        description={`Tidak bisa dibatalkan. ${upcomingBookings} jadwal mendatang dibatalkan dan ${remainingSessions} sisa sesi hangus.`}
        confirmLabel="Ya, hapus data"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={approve}
      />
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resetUserTotp } from "../actions";

export default function ResetTotpButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    startTransition(async () => {
      const res = await resetUserTotp(userId);
      setOpen(false);
      // Berhasil: halaman dimuat ulang (revalidatePath), baris jadi "Tidak
      // aktif" dan tombol ini hilang -- itu konfirmasinya.
      if (res.error) setMessage(res.error);
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="whitespace-nowrap">
        Reset 2FA
      </Button>
      {message && <span role="status" className="block text-sm text-text">{message}</span>}
      <ConfirmDialog
        open={open}
        title={`Reset 2FA ${userName}?`}
        description="Lakukan hanya kalau pengguna kehilangan HP/aplikasi authenticator dan kamu yakin ini memang dia (misal lewat WhatsApp nomor terdaftar). Setelah direset, siapa pun yang tahu password-nya bisa masuk tanpa kode. Semua sesi yang terbuka ikut keluar."
        confirmLabel="Ya, reset 2FA"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={reset}
      />
    </>
  );
}

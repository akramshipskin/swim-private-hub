"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Dialog konfirmasi asli (src/components/ui/confirm-dialog.tsx) posisinya
// "fixed inset-0" -- gak bisa ditampilkan "selalu terbuka" berdampingan
// terang/gelap kayak contoh lain di halaman ini tanpa menutupi seisi layar.
// Jadi didemokan sebagai tombol nyata yang membuka komponen sungguhan
// (bukan tiruan), memakai tema situs yang sedang aktif.
export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Coba: Nonaktifkan Budi
      </Button>
      <ConfirmDialog
        open={open}
        title="Nonaktifkan Budi?"
        description="Paket & booking peserta ini tidak bisa diakses lagi sampai diaktifkan ulang."
        confirmLabel="Ya, nonaktifkan"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

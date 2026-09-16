"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// router.back() (bukan Link ke path tetap) -- halaman ini bisa kebuka dari
// Cari Coach (member login) ATAU dari link yang dishare manual (anonim,
// gak ada "asal" yang pasti), jadi balik ke history browser lebih bener
// buat dua-duanya daripada nebak 1 tujuan.
export default function BackButton() {
  const router = useRouter();

  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
      &larr; Kembali
    </Button>
  );
}

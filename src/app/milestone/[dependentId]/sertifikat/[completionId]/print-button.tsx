"use client";

import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button type="button" size="sm" onClick={() => window.print()}>
      Cetak / Simpan PDF
    </Button>
  );
}

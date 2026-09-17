"use client";

import { useState } from "react";
import { toggleUserActive } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ToggleActiveButton({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleUserActive(userId, !isActive);
    setLoading(false);
    setOpen(false);
  }

  if (!isActive) {
    return (
      <Button variant="ghost" size="sm" onClick={handleToggle} loading={loading}>
        Aktifkan
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Nonaktifkan
      </Button>
      <ConfirmDialog
        open={open}
        title={`Nonaktifkan ${userName}?`}
        description="Pengguna ini tidak bisa masuk lagi sampai diaktifkan ulang."
        confirmLabel="Ya, nonaktifkan"
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

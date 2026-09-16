"use client";

import { useState } from "react";
import { togglePoolActive } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function PoolActiveToggle({
  poolId,
  poolName,
  isActive,
}: {
  poolId: string;
  poolName: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await togglePoolActive(poolId, !isActive);
    setLoading(false);
    setOpen(false);
  }

  if (!isActive) {
    return (
      <Button variant="ghost" size="sm" onClick={handleToggle} loading={loading}>
        Approve
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
        title={`Nonaktifkan ${poolName}?`}
        description="Kolam ini bakal ilang dari dropdown booking member sampai diaktifkan ulang."
        confirmLabel="Ya, nonaktifkan"
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

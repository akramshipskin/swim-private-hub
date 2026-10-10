"use client";

import { useState } from "react";
import { toggleUserActive } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildApprovalWaLink } from "@/lib/whatsapp";

export default function ToggleActiveButton({
  userId,
  userName,
  isActive,
  phone,
  role,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
  phone?: string | null;
  role?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await toggleUserActive(userId, !isActive);
    setApproved(!!res?.firstApproval);
    setLoading(false);
    setOpen(false);
  }

  // Persetujuan pertama coach/pemilik kolam: tawarkan kabar lewat WhatsApp.
  if (approved && phone && (role === "COACH" || role === "POOL_OWNER")) {
    return (
      <a
        href={buildApprovalWaLink(phone, userName, role)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md px-2 py-1.5 text-sm font-medium text-whatsapp-text hover:bg-whatsapp/10 max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center"
      >
        Kabari Lewat WhatsApp
      </a>
    );
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
        description="Akun ini tidak bisa masuk lagi sampai diaktifkan ulang."
        confirmLabel="Ya, Nonaktifkan"
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

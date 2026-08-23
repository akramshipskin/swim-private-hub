"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PesertaPackageRow from "./peserta-package-row";

type PesertaPkg = {
  id: string;
  name: string;
  sisaSesi: number;
  totalSesi: number;
  jatahCancel: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  expiredDate: Date | null;
  expiredDateInput: string;
  cancelRemaining: number;
};

type Peserta = {
  dependentId: string;
  label: string;
  pkg: PesertaPkg | null;
};

export default function MemberCard({
  memberName,
  memberContact,
  memberSinceLabel,
  peserta,
}: {
  memberName: string;
  memberContact: string;
  memberSinceLabel: string;
  peserta: Peserta[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function cancel() {
    setIsEditing(false);
    // Ganti key biar semua form baris peserta remount -- balikin field
    // yang belum di-Simpan ke defaultValue asli, bukan cuma di-disable.
    setFormKey((k) => k + 1);
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">
              {memberName} <span className="text-text-subtle">({memberContact})</span>
            </p>
            <p className="text-xs text-text-subtle">
              Member sejak {memberSinceLabel} · {peserta.length} peserta
            </p>
          </div>
          {isEditing ? (
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              Selesai
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <div key={formKey} className="flex flex-col divide-y divide-border">
          {peserta.map((p) => (
            <PesertaPackageRow key={p.dependentId} label={p.label} pkg={p.pkg} isEditing={isEditing} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

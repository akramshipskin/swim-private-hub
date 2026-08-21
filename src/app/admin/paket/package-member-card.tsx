"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePackage } from "./actions";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusTone = {
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
} as const;

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
};

// Format singkat (16 Sep 2026) buat ringkasan paket -- formatDateLabel
// (weekday + nama bulan penuh) kepanjangan buat kotak ringkas ini,
// bikin nabrak sama baris "Jatah batal" di bawahnya pas mobile.
function shortDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

type Pkg = {
  id: string;
  name: string;
  sisaSesi: number;
  totalSesi: number;
  jatahCancel: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  expiredDate: Date | null;
  expiredDateInput: string;
};

export default function PackageMemberCard({
  pkg,
  memberName,
  memberContact,
  memberSinceLabel,
  cancelRemaining,
}: {
  pkg: Pkg;
  memberName: string;
  memberContact: string;
  memberSinceLabel: string;
  cancelRemaining: number;
}) {
  const [state, formAction, pending] = useActionState(updatePackage, null);
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [justEnteredEdit, setJustEnteredEdit] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function startEdit() {
    setIsEditing(true);
    setJustEnteredEdit(true);
    setTimeout(() => setJustEnteredEdit(false), 400);
  }

  function cancel() {
    setIsEditing(false);
    setFormKey((k) => k + 1);
  }

  const locked = !isEditing;

  return (
    <Card>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">
            {memberName} <span className="text-text-subtle">({memberContact})</span>
          </p>
          <p className="text-xs text-text-subtle">Member sejak {memberSinceLabel}</p>
          <p className="mb-3 mt-1 text-sm text-text-muted">{pkg.name}</p>

          {locked ? (
            <div className="hidden sm:block">
              <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
                Edit
              </Button>
            </div>
          ) : (
            <div>
              <form
                key={formKey}
                action={formAction}
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <input type="hidden" name="packageId" value={pkg.id} />
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <Field label="Sisa Sesi">
                    <Input
                      type="number"
                      name="sisaSesi"
                      defaultValue={pkg.sisaSesi}
                      min={0}
                      max={pkg.totalSesi}
                      className="w-full sm:w-20"
                    />
                  </Field>
                  <Field label="Status">
                    <Select name="status" defaultValue={pkg.status} className="w-full sm:w-44">
                      <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
                      <option value="ACTIVE">Aktif</option>
                      <option value="EXPIRED">Kedaluwarsa</option>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <Field label="Jatah Cancel">
                    <Input
                      type="number"
                      name="jatahCancel"
                      defaultValue={pkg.jatahCancel}
                      min={0}
                      className="w-full sm:w-20"
                    />
                  </Field>
                  <Field label="Berlaku Sampai">
                    <Input
                      type="date"
                      name="expiredDate"
                      defaultValue={pkg.expiredDateInput}
                      className="w-full sm:w-40"
                    />
                  </Field>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={pending}
                    disabled={justEnteredEdit}
                  >
                    Simpan
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={cancel}>
                    Batal
                  </Button>
                </div>
              </form>
              {state?.error && (
                <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                  {state.error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-full rounded-lg bg-surface-muted px-4 py-3 sm:w-auto sm:shrink-0 sm:text-right">
          <div className="flex items-center justify-between sm:block">
            <Badge tone={statusTone[pkg.status]}>{statusLabel[pkg.status]}</Badge>
            {locked && (
              <div className="sm:hidden">
                <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
                  Edit
                </Button>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-text">
            {pkg.sisaSesi}/{pkg.totalSesi} sesi
          </p>
          <p className="text-xs text-text-subtle">
            {pkg.expiredDate ? `Berlaku s.d. ${shortDate(pkg.expiredDate)}` : "Gak ada batas waktu"}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            Jatah batal: {cancelRemaining}/{pkg.jatahCancel}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

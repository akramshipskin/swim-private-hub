"use client";

import { useActionState } from "react";
import { updatePackage } from "./actions";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  cancelRemaining: number;
};

export default function PesertaPackageRow({
  label,
  pkg,
  isEditing,
}: {
  label: string;
  pkg: Pkg | null;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePackage, null);

  if (!pkg) {
    return (
      <div className="py-3 first:pt-0 last:pb-0">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-subtle">Belum ada paket aktif.</p>
      </div>
    );
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mb-1 text-sm text-text-muted">{pkg.name}</p>

          {isEditing && (
            <form action={formAction} className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
              {/* input type=date di WebKit iOS gak respect width:100% --
                  render-nya tetep di lebar aslinya sendiri walau dikasih
                  w-full (kebukti dari screenshot: flex-1 bikin kotak
                  kosong nganggur, bukan ke-stretch). Solusinya: jangan
                  paksa lebar dia sama sekali (shrink-to-fit natural),
                  cuma dibatesin max-w-full biar gak bisa nembus keluar. */}
              <div className="flex flex-wrap gap-3 sm:contents">
                <Field label="Jatah Cancel" className="w-20 shrink-0">
                  <Input
                    type="number"
                    name="jatahCancel"
                    defaultValue={pkg.jatahCancel}
                    min={0}
                    className="w-full sm:w-20"
                  />
                </Field>
                <Field label="Berlaku Sampai" className="min-w-0 max-w-full">
                  <Input
                    type="date"
                    name="expiredDate"
                    defaultValue={pkg.expiredDateInput}
                    className="max-w-full sm:w-40"
                  />
                </Field>
              </div>
              <Button type="submit" variant="primary" size="sm" loading={pending}>
                Simpan
              </Button>
            </form>
          )}
          {state?.error && (
            <p role="alert" className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {state.error}
            </p>
          )}
        </div>

        <div className="w-full rounded-lg bg-surface-muted px-4 py-3 sm:w-auto sm:shrink-0 sm:text-right">
          <Badge tone={statusTone[pkg.status]}>{statusLabel[pkg.status]}</Badge>
          <p className="mt-2 text-sm font-semibold text-text">
            {pkg.sisaSesi}/{pkg.totalSesi} sesi
          </p>
          <p className="text-xs text-text-subtle">
            {pkg.expiredDate ? `Berlaku s.d. ${shortDate(pkg.expiredDate)}` : "Gak ada batas waktu"}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            Jatah batal: {pkg.cancelRemaining}/{pkg.jatahCancel}
          </p>
        </div>
      </div>
    </div>
  );
}

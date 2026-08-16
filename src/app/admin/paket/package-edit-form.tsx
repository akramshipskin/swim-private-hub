"use client";

import { useActionState } from "react";
import { updatePackage } from "./actions";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Pkg = {
  id: string;
  sisaSesi: number;
  totalSesi: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  expiredDateInput: string;
};

export default function PackageEditForm({ pkg }: { pkg: Pkg }) {
  const [state, formAction, pending] = useActionState(updatePackage, null);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="packageId" value={pkg.id} />
        <Field label="Sisa Sesi">
          <Input
            type="number"
            name="sisaSesi"
            defaultValue={pkg.sisaSesi}
            min={0}
            max={pkg.totalSesi}
            className="w-20"
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={pkg.status} className="w-44">
            <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
            <option value="ACTIVE">Aktif</option>
            <option value="EXPIRED">Kedaluwarsa</option>
          </Select>
        </Field>
        <Field label="Berlaku Sampai">
          <Input
            type="date"
            name="expiredDate"
            defaultValue={pkg.expiredDateInput}
            className="w-40"
          />
        </Field>
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Simpan
        </Button>
      </form>
      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}
    </div>
  );
}

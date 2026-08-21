"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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

  if (locked) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
        Edit
      </Button>
    );
  }

  return (
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
        <Field label="Berlaku Sampai">
          <Input
            type="date"
            name="expiredDate"
            defaultValue={pkg.expiredDateInput}
            className="w-full sm:w-40"
          />
        </Field>

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
  );
}

"use client";

import { useActionState } from "react";
import { updatePoolShares } from "./actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditLock } from "@/hooks/use-edit-lock";

export default function PoolShareForm({
  poolId,
  commissionPercent,
  coachSharePercent,
}: {
  poolId: string;
  commissionPercent: number;
  coachSharePercent: number;
}) {
  const [state, formAction, pending] = useActionState(updatePoolShares, null);
  const edit = useEditLock(pending, state?.error);

  return (
    <form key={edit.formKey} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="poolId" value={poolId} />
      <Field label="Komisi Platform (%)">
        <Input
          type="number"
          name="commissionPercent"
          min={0}
          max={100}
          defaultValue={commissionPercent}
          disabled={edit.locked}
          className="w-24"
        />
      </Field>
      <Field label="Bagian Coach (%)">
        <Input
          type="number"
          name="coachSharePercent"
          min={0}
          max={100}
          defaultValue={coachSharePercent}
          disabled={edit.locked}
          className="w-24"
        />
      </Field>
      <div className="flex flex-col justify-end">
        <span className="mb-1.5 text-xs text-text-muted">Bagian Kolam</span>
        <span className="py-2 text-sm font-semibold text-text">{100 - commissionPercent - coachSharePercent}%</span>
      </div>
      {edit.locked ? (
        <Button type="button" size="sm" variant="secondary" onClick={edit.startEdit}>
          Edit
        </Button>
      ) : (
        <>
          <Button type="submit" size="sm" loading={pending} disabled={edit.saveDisabled}>
            Simpan
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={edit.cancel} disabled={pending}>
            Batal
          </Button>
        </>
      )}
      {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

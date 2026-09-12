"use client";

import { useActionState } from "react";
import { updatePoolShares } from "./actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="poolId" value={poolId} />
      <Field label="Komisi Platform (%)">
        <Input
          type="number"
          name="commissionPercent"
          min={0}
          max={100}
          defaultValue={commissionPercent}
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
          className="w-24"
        />
      </Field>
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        Simpan
      </Button>
      {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

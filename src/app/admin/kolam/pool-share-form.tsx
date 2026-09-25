"use client";

import { useActionState, useState } from "react";
import { updatePoolShares } from "./actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditLock } from "@/hooks/use-edit-lock";

// Tiga bagian komisi selalu berjumlah 100%. Yang disimpan cuma dua angka
// (platform & coach), bagian kolam = sisanya -- tapi admin boleh mengetik
// angka kolam langsung, dan bagian platform yang menyesuaikan.
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
  const [platform, setPlatform] = useState(commissionPercent);
  const [coach, setCoach] = useState(coachSharePercent);
  // Kolom kosong = NaN (bukan 0), supaya komisi 0% tidak tersimpan diam-diam.
  const pool = 100 - platform - coach;
  const blank = !Number.isFinite(platform) || !Number.isFinite(coach);
  const shown = (v: number) => (Number.isFinite(v) ? v : "");

  function reset() {
    setPlatform(commissionPercent);
    setCoach(coachSharePercent);
    edit.cancel();
  }

  const clamp = (v: number) => (Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : NaN);

  return (
    <form key={edit.formKey} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="poolId" value={poolId} />
      <input type="hidden" name="commissionPercent" value={shown(platform)} />
      <input type="hidden" name="coachSharePercent" value={shown(coach)} />
      <Field label="Komisi platform (%)">
        <Input
          type="number"
          min={0}
          max={100}
          value={shown(platform)}
          onChange={(e) => setPlatform(clamp(e.target.valueAsNumber))}
          disabled={edit.locked}
          className="w-24"
        />
      </Field>
      <Field label="Komisi coach (%)">
        <Input
          type="number"
          min={0}
          max={100}
          value={shown(coach)}
          onChange={(e) => setCoach(clamp(e.target.valueAsNumber))}
          disabled={edit.locked}
          className="w-24"
        />
      </Field>
      <Field label="Komisi kolam (%)">
        <Input
          type="number"
          min={0}
          max={100}
          value={shown(pool)}
          // Mengetik angka kolam = mengubah bagian platform; bagian coach
          // dibiarkan, karena itu yang sudah dijanjikan ke coach.
          onChange={(e) => setPlatform(clamp(100 - coach - clamp(e.target.valueAsNumber)))}
          disabled={edit.locked}
          className="w-24"
        />
      </Field>
      {edit.locked ? (
        <Button type="button" size="sm" variant="secondary" onClick={edit.startEdit}>
          Edit
        </Button>
      ) : (
        <>
          <Button type="submit" size="sm" loading={pending} disabled={edit.saveDisabled || blank || pool < 0}>
            Simpan
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={pending}>
            Batal
          </Button>
        </>
      )}
      {blank && !edit.locked && <p className="w-full text-xs text-danger-text">Semua kolom komisi wajib diisi (0-100).</p>}
      {pool < 0 && <p className="w-full text-xs text-danger-text">Total ketiganya tidak boleh lebih dari 100%.</p>}
      {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}

"use client";

import { useActionState, useRef, useState } from "react";
import { affiliateCoach, removeAffiliation } from "./actions";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Coach = { id: string; name: string };
type Affiliation = { id: string; coachId: string; coachName: string; photoUrl: string | null };

export default function AffiliateCoachForm({
  poolId,
  allCoaches,
  affiliations,
}: {
  poolId: string;
  allCoaches: Coach[];
  affiliations: Affiliation[];
}) {
  const [state, formAction, pending] = useActionState(affiliateCoach, null);
  const affiliatedIds = new Set(affiliations.map((a) => a.coachId));
  const availableCoaches = allCoaches.filter((c) => !affiliatedIds.has(c.id));
  // Lepas afiliasi ikut ngehapus semua slot KOSONG coach itu ke depan di
  // kolam ini -- gak bisa dibalikin, jadi konfirmasi dulu.
  const [removing, setRemoving] = useState<Affiliation | null>(null);
  const removeForms = useRef(new Map<string, HTMLFormElement>());

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs font-medium text-text-muted">Coach terafiliasi</p>
      {/* Chip coach existing dan form tambah dijadikan satu baris flow yang
          sama (Hadi 18 Sep v3: "bikin sejajar") -- form-nya ikut ngalir di
          ujung daftar chip, bukan ditumpuk di baris sendiri di bawahnya. */}
      <div className="flex flex-wrap items-center gap-2">
        {affiliations.length === 0 && availableCoaches.length === 0 && (
          <span className="text-xs text-text-subtle">Belum ada coach.</span>
        )}
        {affiliations.map((a) => (
          <form
            key={a.id}
            action={removeAffiliation}
            ref={(el) => {
              if (el) removeForms.current.set(a.id, el);
              else removeForms.current.delete(a.id);
            }}
          >
            <input type="hidden" name="affiliationId" value={a.id} />
            <div className="flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface py-1 pr-2 pl-1">
              <Avatar src={a.photoUrl} className="h-8 w-8" />
              <span className="text-sm text-text">{a.coachName}</span>
              <button
                type="button"
                onClick={() => setRemoving(a)}
                aria-label={`Lepas ${a.coachName} dari kolam ini`}
                className="rounded-full px-1.5 text-lg leading-none text-text-subtle hover:bg-danger-bg hover:text-danger-text"
              >
                ×
              </button>
            </div>
          </form>
        ))}
        {availableCoaches.length > 0 && (
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="poolId" value={poolId} />
            <Select name="coachId" className="w-44 sm:w-52" defaultValue="">
              <option value="" disabled>
                — pilih coach --
              </option>
              {availableCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" loading={pending}>
              Tambah
            </Button>
          </form>
        )}
      </div>
      {state?.error && <p className="text-xs text-danger-text">{state.error}</p>}
      <ConfirmDialog
        open={removing !== null}
        title={`Lepas ${removing?.coachName ?? "coach"} dari kolam ini?`}
        description="Semua slot kosong coach ini di kolam ini mulai sekarang akan dihapus. Sesi yang sudah dibooking tetap berjalan."
        confirmLabel="Ya, lepas"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const id = removing?.id;
          setRemoving(null);
          if (id) removeForms.current.get(id)?.requestSubmit();
        }}
      />
    </div>
  );
}

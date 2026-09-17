"use client";

import { useActionState } from "react";
import { affiliateCoach, removeAffiliation } from "./actions";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

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

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs font-medium text-text-muted">Coach terafiliasi</p>
      <div className="flex flex-wrap gap-2">
        {affiliations.length === 0 && <span className="text-xs text-text-subtle">Belum ada coach.</span>}
        {affiliations.map((a) => (
          <form key={a.id} action={removeAffiliation}>
            <input type="hidden" name="affiliationId" value={a.id} />
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-2 pl-1">
              <Avatar src={a.photoUrl} className="h-7 w-7" />
              <span className="text-sm text-text">{a.coachName}</span>
              <button
                type="submit"
                aria-label={`Lepas ${a.coachName} dari kolam ini`}
                className="rounded-full px-1.5 text-text-subtle hover:bg-danger-bg hover:text-danger-text"
              >
                ×
              </button>
            </div>
          </form>
        ))}
      </div>
      {availableCoaches.length > 0 && (
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="poolId" value={poolId} />
          <Select name="coachId" className="w-full sm:w-52" defaultValue="">
            <option value="" disabled>
              — pilih coach --
            </option>
            {availableCoaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="secondary" loading={pending}>
            Tambah
          </Button>
        </form>
      )}
      {state?.error && <p className="text-xs text-danger-text">{state.error}</p>}
    </div>
  );
}

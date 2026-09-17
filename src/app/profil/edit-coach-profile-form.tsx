"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCoachProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";

export default function EditCoachProfileForm({
  profile,
}: {
  profile: { bio: string | null; specialties: string[]; hasCertification: boolean; certificationNote: string | null };
}) {
  const [state, formAction, pending] = useActionState(updateCoachProfile, null);
  const [hasCertification, setHasCertification] = useState(profile.hasCertification);
  const [savedAt, setSavedAt] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      setSavedAt(Date.now());
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Bio singkat (opsional)">
        <Textarea
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={3}
          maxLength={500}
          placeholder="Pengalaman ngajar, pendekatan ngajar, dll."
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text">Keahlian (pilih minimal 1)</legend>
        <div className="flex flex-wrap gap-2">
          {COACH_SPECIALTIES.map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="checkbox"
                name="specialties"
                value={s}
                defaultChecked={profile.specialties.includes(s)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                {s}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="hasCertification"
          checked={hasCertification}
          onChange={(e) => setHasCertification(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500"
        />
        <span>Saya punya sertifikasi renang/lifeguard resmi</span>
      </label>
      {hasCertification && (
        <Field label="Nama sertifikat/lembaga">
          <Input
            name="certificationNote"
            defaultValue={profile.certificationNote ?? ""}
            placeholder="Misal: Sertifikasi Pelatih Renang FASI"
          />
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending} className="w-full sm:w-auto">
          Simpan Profil Coach
        </Button>
        {state?.error && (
          <p role="alert" className="text-sm text-danger-text">
            {state.error}
          </p>
        )}
        {savedAt > 0 && !state?.error && (
          <p role="status" className="text-sm text-success-text">
            Profil coach tersimpan.
          </p>
        )}
      </div>
    </form>
  );
}

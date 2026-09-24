"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCoachProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

// <input type="date"> & DatePicker pakai format YYYY-MM-DD di zona WIB.
function toDateInput(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";
import { useEditLock } from "@/hooks/use-edit-lock";

export default function EditCoachProfileForm({
  profile,
}: {
  profile: { bio: string | null; specialties: string[]; birthDate: Date | null; gender: "MALE" | "FEMALE" | null };
}) {
  const [state, formAction, pending] = useActionState(updateCoachProfile, null);
  const [savedAt, setSavedAt] = useState(0);
  const wasPending = useRef(false);
  const edit = useEditLock(pending, state?.error);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      setSavedAt(Date.now());
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form key={edit.formKey} action={formAction} className="flex flex-col gap-4">
      <fieldset disabled={edit.locked} className="flex flex-col gap-4 disabled:opacity-90">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tanggal lahir">
          <DatePicker name="birthDate" defaultValue={profile.birthDate ? toDateInput(profile.birthDate) : ""} clearable />
        </Field>
        <Field label="Jenis kelamin">
          <Select name="gender" defaultValue={profile.gender ?? ""}>
            <option value="">Belum diisi</option>
            <option value="MALE">Laki-laki</option>
            <option value="FEMALE">Perempuan</option>
          </Select>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-text-subtle">
        Umur dihitung otomatis dari tanggal lahir dan tampil di profil publik kamu, bersama jenis kelamin. Orang tua
        sering memilih coach berdasarkan dua hal ini.
      </p>

      <Field label="Bio singkat (opsional)">
        <Textarea
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={3}
          maxLength={500}
          placeholder="Pengalaman mengajar, pendekatan mengajar, dll."
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
              <span className="inline-flex items-center max-sm:min-h-[44px] rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                {s}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        {edit.locked ? (
          <Button type="button" variant="secondary" onClick={edit.startEdit} className="w-full sm:w-auto">
            Edit Profil Coach
          </Button>
        ) : (
          <>
            <Button type="submit" loading={pending} disabled={edit.saveDisabled}>
              Simpan
            </Button>
            <Button type="button" variant="ghost" onClick={edit.cancel} disabled={pending}>
              Batal
            </Button>
          </>
        )}
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

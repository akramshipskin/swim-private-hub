"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateName } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useEditLock } from "@/hooks/use-edit-lock";

export default function EditNameForm({ currentName, label }: { currentName: string; label: string }) {
  const [state, formAction, pending] = useActionState(updateName, null);
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
    <form key={edit.formKey} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label={label}>
          {/* key={currentName} biar input remount tiap currentName berubah dari
              server (abis revalidatePath) -- defaultValue cuma dibaca sekali
              pas mount, gak reaktif ke prop baru, jadi field kelihatan "gak
              kesimpen" walau di DB udah bener kalau gak di-remount. */}
          <Input key={currentName} name="name" defaultValue={currentName} required disabled={edit.locked} className="w-full" />
        </Field>
      </div>
      {edit.locked ? (
        <Button type="button" variant="secondary" onClick={edit.startEdit} className="w-full sm:w-auto">
          Edit Nama
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button type="submit" loading={pending} disabled={edit.saveDisabled} className="flex-1 sm:flex-none">
            Simpan
          </Button>
          <Button type="button" variant="ghost" onClick={edit.cancel} disabled={pending}>
            Batal
          </Button>
        </div>
      )}
      {state?.error && (
        <p role="alert" className="text-sm text-danger-text">
          {state.error}
        </p>
      )}
      {savedAt > 0 && !state?.error && (
        <p role="status" className="text-sm text-success-text">
          Nama tersimpan.
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateName } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function EditNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(updateName, null);
  const [savedAt, setSavedAt] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      setSavedAt(Date.now());
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="Nama">
          {/* key={currentName} biar input remount tiap currentName berubah dari
              server (abis revalidatePath) -- defaultValue cuma dibaca sekali
              pas mount, gak reaktif ke prop baru, jadi field kelihatan "gak
              kesimpen" walau di DB udah bener kalau gak di-remount. */}
          <Input key={currentName} name="name" defaultValue={currentName} required className="w-full" />
        </Field>
      </div>
      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Simpan Nama
      </Button>
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

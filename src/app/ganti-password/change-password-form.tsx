"use client";

import { useActionState, useState } from "react";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type Participant = { type: "self" | "child"; name: string };

export default function ChangePasswordForm({
  isMember,
  memberName,
}: {
  isMember: boolean;
  memberName: string;
}) {
  const [state, formAction, pending] = useActionState(changePassword, null);
  const [participants, setParticipants] = useState<Participant[]>([
    { type: "self", name: "" },
  ]);

  function updateParticipant(i: number, patch: Partial<Participant>) {
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Password Baru">
        <PasswordInput name="newPassword" placeholder="••••••••" required autoComplete="new-password" />
      </Field>
      <Field label="Konfirmasi Password Baru">
        <PasswordInput name="confirmPassword" placeholder="••••••••" required autoComplete="new-password" />
      </Field>

      {isMember && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text">Siapa yang mau les?</p>
          <p className="text-xs text-text-subtle">
            Bisa diri sendiri, bisa anak, bisa keduanya. Bisa ditambah lagi nanti.
          </p>
          {participants.map((p, i) => {
            // "Diri sendiri" cuma boleh dipilih di 1 baris -- sama kayak
            // register/page.tsx, biar gak keliatan bikin beberapa "diri
            // sendiri" padahal cuma 1 yang beneran ke-create.
            const selfTakenElsewhere = participants.some(
              (other, idx) => idx !== i && other.type === "self"
            );
            return (
            <div key={i} className="flex gap-2">
              <Select
                name="participantType"
                value={p.type}
                onChange={(e) => updateParticipant(i, { type: e.target.value as Participant["type"] })}
                className="w-32 shrink-0"
              >
                {!selfTakenElsewhere && <option value="self">Diri sendiri</option>}
                <option value="child">Anak</option>
              </Select>
              {p.type === "self" ? (
                <>
                  <p className="flex min-h-[44px] min-w-0 flex-1 items-center truncate rounded-xl border border-border bg-surface-muted px-3 text-sm text-text-muted">
                    {memberName}
                  </p>
                  <input type="hidden" name="participantName" value="" />
                </>
              ) : (
                <Input
                  name="participantName"
                  value={p.name}
                  onChange={(e) => updateParticipant(i, { name: e.target.value })}
                  placeholder="Nama anak"
                  required
                  className="min-w-0 flex-1"
                />
              )}
            </div>
            );
          })}
          <button
            type="button"
            onClick={() => setParticipants((prev) => [...prev, { type: "child", name: "" }])}
            className="self-start text-sm font-medium text-brand-700 hover:underline max-sm:min-h-[44px]"
          >
            + Tambah peserta lain
          </button>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={pending} className="mt-1 w-full">
        Simpan & Lanjut
      </Button>
    </form>
  );
}

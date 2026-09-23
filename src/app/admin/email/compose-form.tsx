"use client";

import { useActionState, useState } from "react";
import { composeEmail } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { INBOX_ADDRESSES } from "@/lib/email";

export default function ComposeForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(composeEmail, null);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Tulis email baru
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text">Email baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-muted hover:text-text">
          Batal
        </button>
      </div>
      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="compose-from">Dari</Label>
              <Select id="compose-from" name="from" defaultValue={INBOX_ADDRESSES[0]} className="mt-1">
                {INBOX_ADDRESSES.map((addr) => (
                  <option key={addr} value={addr}>{addr}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="compose-to">Ke</Label>
              <Input id="compose-to" name="to" type="email" placeholder="nama@email.com" required className="mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="compose-subject">Subjek</Label>
              <Input id="compose-subject" name="subject" required maxLength={200} className="mt-1" />
            </div>
            <div className="flex flex-1 flex-col">
              <Label htmlFor="compose-content">Isi</Label>
              <Textarea id="compose-content" name="content" required maxLength={4000} className="mt-1 flex-1 min-h-[10rem]" />
            </div>
          </div>
        </div>

        {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}

        <div className="flex justify-end">
          <Button type="submit" loading={pending}>Kirim</Button>
        </div>
      </form>
    </div>
  );
}

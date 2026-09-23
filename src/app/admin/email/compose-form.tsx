"use client";

import { useActionState, useState } from "react";
import { composeEmail } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
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
    <Card className="max-w-2xl">
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Email baru</p>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-muted hover:text-text">
            Batal
          </button>
        </div>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div>
            <Label htmlFor="compose-subject">Subjek</Label>
            <Input id="compose-subject" name="subject" required maxLength={200} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="compose-content">Isi</Label>
            <Textarea id="compose-content" name="content" rows={5} maxLength={4000} required className="mt-1" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={pending}>Kirim</Button>
          </div>
          {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}
        </form>
      </CardBody>
    </Card>
  );
}

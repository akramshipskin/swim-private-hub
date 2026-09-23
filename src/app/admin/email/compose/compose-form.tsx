"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { composeEmail } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { INBOX_ADDRESSES } from "@/lib/email";

export default function ComposeForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(composeEmail, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            <Textarea id="compose-content" name="content" required maxLength={4000} className="mt-1 flex-1 min-h-[16rem]" />
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/email")}>Batal</Button>
        <Button type="submit" loading={pending}>Kirim</Button>
      </div>
    </form>
  );
}

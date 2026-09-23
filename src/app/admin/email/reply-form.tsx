"use client";

import { useActionState } from "react";
import { replyToEmailThread } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const [state, formAction, pending] = useActionState(replyToEmailThread, null);
  return (
    <form action={formAction} key={pending ? "p" : "i"} className="flex flex-col gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <label htmlFor="email-reply-content" className="sr-only">Balasan</label>
      <Textarea id="email-reply-content" name="content" rows={4} maxLength={4000} placeholder="Tulis balasan…" required />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4" /> Tandai selesai
        </label>
        <Button type="submit" size="sm" loading={pending}>Kirim balasan</Button>
      </div>
      {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}
    </form>
  );
}

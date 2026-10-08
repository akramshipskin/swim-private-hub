"use client";

import { useActionState } from "react";
import { replyToEmailThread } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default function ReplyForm({ threadId, to }: { threadId: string; to: string }) {
  const [state, formAction, pending] = useActionState(replyToEmailThread, null);
  return (
    <form action={formAction} key={pending ? "p" : "i"} id="balas" className="flex scroll-mt-24 flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="text-xs text-text-subtle">Balas ke <span className="font-medium text-text-muted">{to}</span></p>
      <input type="hidden" name="threadId" value={threadId} />
      <label htmlFor="email-reply-content" className="sr-only">Balasan</label>
      <Textarea id="email-reply-content" name="content" rows={4} maxLength={4000} placeholder="Tulis balasan…" required />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-text-muted max-lg:min-h-[44px]">
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4 rounded border-border text-brand-700 focus:ring-brand-500" /> Tandai Selesai
        </label>
        <Button type="submit" size="sm" loading={pending}>Kirim Balasan</Button>
      </div>
      {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}
    </form>
  );
}

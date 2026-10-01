"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { approveAction, rejectAction } from "./actions";

export default function DecideForm({ requestId, approveLabel }: { requestId: string; approveLabel: string }) {
  const [approveState, approve, approving] = useActionState(approveAction, null);
  const [rejectState, reject, rejecting] = useActionState(rejectAction, null);
  return (
    <div className="flex flex-col gap-3">
      <form action={approve}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" size="sm" loading={approving} disabled={rejecting}>
          {approveLabel}
        </Button>
        {approveState?.error && <p className="mt-1 text-xs text-danger-text">{approveState.error}</p>}
      </form>
      <form action={reject} className="flex flex-col gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <Textarea name="note" rows={2} placeholder="Alasan menolak (dikirim ke member)" aria-label="Alasan menolak" />
        <Button type="submit" size="sm" variant="secondary" loading={rejecting} disabled={approving} className="self-start">
          Tolak
        </Button>
        {rejectState?.error && <p className="text-xs text-danger-text">{rejectState.error}</p>}
      </form>
    </div>
  );
}

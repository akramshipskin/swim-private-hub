"use client";

import { useActionState } from "react";
import { approveCancelRequest, rejectCancelRequest } from "./actions";
import { Button } from "@/components/ui/button";

export default function CancelRequestItem({ requestId }: { requestId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveCancelRequest, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectCancelRequest, null);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <form action={rejectAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button type="submit" variant="secondary" size="sm" disabled={approvePending} loading={rejectPending}>
            Tolak
          </Button>
        </form>
        <form action={approveAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button type="submit" variant="primary" size="sm" disabled={rejectPending} loading={approvePending}>
            Approve
          </Button>
        </form>
      </div>
      {(approveState?.error || rejectState?.error) && (
        <p className="max-w-[220px] text-right text-xs text-danger-text">
          {approveState?.error || rejectState?.error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { processWithdrawal, markPaidManually, rejectWithdrawal } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

export type WithdrawalRowData = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  holderLabel: string;
};

export default function WithdrawalRow({ w }: { w: WithdrawalRowData }) {
  const [processState, processAction, processPending] = useActionState(processWithdrawal, null);
  const [paidState, paidAction, paidPending] = useActionState(markPaidManually, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectWithdrawal, null);

  const canAct = w.status === "PENDING" || w.status === "PROCESSING";

  return (
    <Card>
      <CardBody className="flex flex-col gap-2 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text">{w.holderLabel}</p>
            <p className="text-lg font-semibold text-text">{formatRupiah(w.amount)}</p>
          </div>
          <Badge tone={w.status === "PAID" ? "success" : w.status === "FAILED" ? "danger" : "neutral"}>
            {w.status === "PENDING" ? "Menunggu" : w.status === "PROCESSING" ? "Diproses" : w.status === "PAID" ? "Selesai" : "Gagal"}
          </Badge>
        </div>
        <p className="text-xs text-text-subtle">
          {w.bankName} · {w.bankAccountNumber} a.n. {w.bankAccountName}
        </p>

        {canAct && (
          <div className="mt-1 flex flex-wrap gap-2">
            <form action={processAction}>
              <input type="hidden" name="withdrawalId" value={w.id} />
              <Button type="submit" size="sm" loading={processPending}>
                Proses via Iris
              </Button>
            </form>
            <form action={paidAction}>
              <input type="hidden" name="withdrawalId" value={w.id} />
              <Button type="submit" size="sm" variant="secondary" loading={paidPending}>
                Tandai Dibayar (Manual)
              </Button>
            </form>
            <form action={rejectAction}>
              <input type="hidden" name="withdrawalId" value={w.id} />
              <Button type="submit" size="sm" variant="danger" loading={rejectPending}>
                Tolak
              </Button>
            </form>
          </div>
        )}
        {/* Gated di dalam canAct -- begitu salah satu action BERHASIL,
            status berubah dan tombol2 ilang (canAct jadi false), jadi
            error dari action LAIN yang gagal duluan gak boleh nyangkut
            nongol lagi padahal urusannya udah kelar. */}
        {canAct && (processState?.error || paidState?.error || rejectState?.error) && (
          <p role="alert" className="text-xs text-danger-text">
            {processState?.error || paidState?.error || rejectState?.error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

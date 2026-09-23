"use client";

import { useActionState, useRef, useState } from "react";
import { processWithdrawal, markPaidManually, rejectWithdrawal } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type WithdrawalRowData = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  processedAt: string | null;
  failureReason: string | null;
  referenceId: string | null;
  holderType: "Kolam" | "Coach";
  holderName: string;
  holderContact: string | null;
  currentBalance: number;
};

function dateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export default function WithdrawalRow({ w, irisEnabled }: { w: WithdrawalRowData; irisEnabled: boolean }) {
  const [processState, processAction, processPending] = useActionState(processWithdrawal, null);
  const [paidState, paidAction, paidPending] = useActionState(markPaidManually, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectWithdrawal, null);
  // Aksi uang (tandai dibayar / tolak) gak bisa dibatalin -- konfirmasi dulu.
  const [confirming, setConfirming] = useState<"paid" | "reject" | null>(null);
  const paidForm = useRef<HTMLFormElement>(null);
  const rejectForm = useRef<HTMLFormElement>(null);

  const canAct = w.status === "PENDING" || w.status === "PROCESSING";

  return (
    <Card>
      <CardBody className="flex flex-col gap-2 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">{w.holderType}</p>
            <p className="text-base font-semibold text-text">{w.holderName}</p>
            <p className="text-2xl font-bold text-text">{formatRupiah(w.amount)}</p>
          </div>
          <Badge tone={w.status === "PAID" ? "success" : w.status === "FAILED" ? "danger" : "warning"}>
            {w.status === "PENDING" ? "Menunggu" : w.status === "PROCESSING" ? "Diproses" : w.status === "PAID" ? "Sudah ditransfer" : "Gagal / ditolak"}
          </Badge>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
          <dt className="text-text-subtle">Rekening</dt>
          <dd className="text-text">{w.bankName} · {w.bankAccountNumber} a.n. {w.bankAccountName}</dd>
          <dt className="text-text-subtle">Diajukan</dt>
          <dd className="text-text">{dateTime(w.requestedAt)}</dd>
          {w.processedAt && (<><dt className="text-text-subtle">Diproses</dt><dd className="text-text">{dateTime(w.processedAt)}</dd></>)}
          {w.referenceId && (<><dt className="text-text-subtle">No. referensi</dt><dd className="text-text">{w.referenceId}</dd></>)}
          {w.failureReason && (<><dt className="text-text-subtle">Alasan</dt><dd className="text-danger-text">{w.failureReason}</dd></>)}
          {w.holderContact && (<><dt className="text-text-subtle">Kontak</dt><dd className="text-text">{w.holderContact}</dd></>)}
          <dt className="text-text-subtle">Sisa saldo</dt>
          <dd className="text-text">{formatRupiah(w.currentBalance)}</dd>
        </dl>

        {canAct && (
          <div className="mt-1 flex flex-wrap gap-2">
            {w.status === "PENDING" && irisEnabled && (
              <form action={processAction}>
                <input type="hidden" name="withdrawalId" value={w.id} />
                <Button type="submit" size="sm" loading={processPending}>
                  Proses via Iris
                </Button>
              </form>
            )}
            <form ref={paidForm} action={paidAction}>
              <input type="hidden" name="withdrawalId" value={w.id} />
              <Button type="button" size="sm" variant="secondary" loading={paidPending} onClick={() => setConfirming("paid")}>
                Tandai Dibayar (Manual)
              </Button>
            </form>
            <form ref={rejectForm} action={rejectAction}>
              <input type="hidden" name="withdrawalId" value={w.id} />
              {w.status === "PROCESSING" && <input type="hidden" name="confirmedFailed" value="true" />}
              <Button type="button" size="sm" variant="danger" loading={rejectPending} onClick={() => setConfirming("reject")}>
                {w.status === "PROCESSING" ? "Tandai Gagal (sudah dicek di Iris)" : "Tolak"}
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
      <ConfirmDialog
        open={confirming === "paid"}
        title="Tandai sudah ditransfer?"
        description={`Pastikan ${formatRupiah(w.amount)} sudah benar-benar ditransfer ke ${w.bankName} ${w.bankAccountNumber} a.n. ${w.bankAccountName}. Status tidak bisa dikembalikan.`}
        confirmLabel="Ya, sudah ditransfer"
        loading={paidPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          paidForm.current?.requestSubmit();
        }}
      />
      <ConfirmDialog
        open={confirming === "reject"}
        title={w.status === "PROCESSING" ? "Tandai pencairan gagal?" : "Tolak pencairan?"}
        description={`Saldo ${formatRupiah(w.amount)} akan dikembalikan ke ${w.holderName}.${w.status === "PROCESSING" ? " Pastikan di dashboard Iris transfernya benar-benar gagal." : ""}`}
        confirmLabel={w.status === "PROCESSING" ? "Ya, gagal" : "Ya, tolak"}
        loading={rejectPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          rejectForm.current?.requestSubmit();
        }}
      />
    </Card>
  );
}

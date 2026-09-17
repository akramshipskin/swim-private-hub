"use client";

import { useActionState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { MIN_WITHDRAWAL } from "@/lib/policy";
import { useEditLock } from "@/hooks/use-edit-lock";

type Withdrawal = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  processedAt: string | null;
  failureReason: string | null;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  midtransReferenceId: string | null;
};

export type SaldoActionState = { error?: string; ok?: boolean } | null;

const statusInfo = {
  PENDING: { label: "Menunggu diproses", tone: "warning" },
  PROCESSING: { label: "Sedang diproses", tone: "neutral" },
  PAID: { label: "Sudah ditransfer", tone: "success" },
  FAILED: { label: "Gagal / ditolak", tone: "danger" },
} as const;

function dateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function maskAccount(n: string) {
  return n.length <= 4 ? n : `•••• ${n.slice(-4)}`;
}

// Dipakai pemilik kolam & coach -- bentuk fiturnya sama (saldo, rekening,
// cairkan, riwayat). Server action dioper sebagai prop.
export default function SaldoView({
  walletBalance,
  bankName,
  bankAccountNumber,
  bankAccountName,
  withdrawals,
  updateBankInfoAction,
  requestWithdrawalAction,
}: {
  walletBalance: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  withdrawals: Withdrawal[];
  updateBankInfoAction: (state: SaldoActionState, formData: FormData) => Promise<SaldoActionState>;
  requestWithdrawalAction: (state: SaldoActionState, formData: FormData) => Promise<SaldoActionState>;
}) {
  const [bankState, bankAction, bankPending] = useActionState(updateBankInfoAction, null);
  const [cairState, cairAction, cairPending] = useActionState(requestWithdrawalAction, null);

  const hasBankInfo = !!(bankName && bankAccountNumber && bankAccountName);
  // Rekening yang sudah tersimpan terkunci; ubah lewat tombol Edit.
  const edit = useEditLock(bankPending, bankState?.error);
  const bankLocked = hasBankInfo && edit.locked;
  const canWithdraw = hasBankInfo && walletBalance >= MIN_WITHDRAWAL;
  const inProcess = withdrawals
    .filter((w) => w.status === "PENDING" || w.status === "PROCESSING")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-text-muted">Saldo bisa dicairkan</p>
              <p className="mt-1 text-3xl font-semibold text-text">{formatRupiah(walletBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Sedang dalam proses</p>
              <p className="mt-1 text-xl font-semibold text-text-muted">{formatRupiah(inProcess)}</p>
            </div>
          </div>

          <form action={cairAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label={`Nominal (min. ${formatRupiah(MIN_WITHDRAWAL)})`} className="flex-1">
              <Input
                id="withdraw-amount"
                type="number"
                name="amount"
                min={MIN_WITHDRAWAL}
                max={walletBalance}
                step={1000}
                defaultValue={walletBalance >= MIN_WITHDRAWAL ? walletBalance : ""}
                disabled={!canWithdraw}
                required
                className="w-full"
              />
            </Field>
            <Button type="submit" disabled={!canWithdraw || cairPending} loading={cairPending}>
              Cairkan
            </Button>
          </form>
          {!hasBankInfo ? (
            <p className="text-sm text-warning-text">Isi rekening tujuan pencairan dulu.</p>
          ) : (
            walletBalance < MIN_WITHDRAWAL && (
              <p className="text-sm text-text-subtle">Saldo belum mencapai minimal pencairan {formatRupiah(MIN_WITHDRAWAL)}.</p>
            )
          )}
          {cairState?.error && <p role="alert" className="text-sm text-danger-text">{cairState.error}</p>}
          {cairState?.ok && <p role="status" className="text-sm text-success-text">Pengajuan pencairan berhasil dibuat.</p>}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Rekening Tujuan Pencairan</h2>
            {hasBankInfo && <Badge tone={bankLocked ? "success" : "warning"}>{bankLocked ? "Tersimpan" : "Sedang diubah"}</Badge>}
          </div>
          <form key={edit.formKey} action={bankAction} className="flex flex-col gap-3">
            <Field label="Nama Bank">
              <Input name="bankName" defaultValue={bankName ?? ""} disabled={bankLocked} required />
            </Field>
            <Field label="Nomor Rekening">
              <Input name="bankAccountNumber" defaultValue={bankAccountNumber ?? ""} disabled={bankLocked} required />
            </Field>
            <Field label="Nama Pemilik Rekening">
              <Input name="bankAccountName" defaultValue={bankAccountName ?? ""} disabled={bankLocked} required />
            </Field>
            {bankLocked ? (
              <Button type="button" variant="secondary" onClick={edit.startEdit} className="w-full">
                Edit Rekening
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="submit" loading={bankPending} disabled={edit.saveDisabled} className="flex-1">
                  Simpan Rekening
                </Button>
                {hasBankInfo && (
                  <Button type="button" variant="ghost" onClick={edit.cancel} disabled={bankPending}>
                    Batal
                  </Button>
                )}
              </div>
            )}
          </form>
          {bankState?.error && <p role="alert" className="mt-2 text-sm text-danger-text">{bankState.error}</p>}
        </CardBody>
      </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-text">Riwayat Pencairan</h2>
        {withdrawals.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center text-sm text-text-muted">Belum ada pengajuan pencairan.</CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => (
              <Card key={w.id}>
                <CardBody className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold text-text">{formatRupiah(w.amount)}</p>
                    <Badge tone={statusInfo[w.status].tone}>{statusInfo[w.status].label}</Badge>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-text-subtle">Diajukan</dt>
                    <dd className="text-text">{dateTime(w.requestedAt)}</dd>
                    {w.processedAt && (
                      <>
                        <dt className="text-text-subtle">{w.status === "FAILED" ? "Ditolak" : "Diproses"}</dt>
                        <dd className="text-text">{dateTime(w.processedAt)}</dd>
                      </>
                    )}
                    <dt className="text-text-subtle">Ke rekening</dt>
                    <dd className="text-text">
                      {w.bankName} {maskAccount(w.bankAccountNumber)} a.n. {w.bankAccountName}
                    </dd>
                    {w.midtransReferenceId && (
                      <>
                        <dt className="text-text-subtle">No. referensi</dt>
                        <dd className="text-text">{w.midtransReferenceId}</dd>
                      </>
                    )}
                    {w.failureReason && (
                      <>
                        <dt className="text-text-subtle">Alasan</dt>
                        <dd className="text-danger-text">{w.failureReason}</dd>
                      </>
                    )}
                  </dl>
                  {w.status === "FAILED" && (
                    <p className="text-xs text-text-subtle">Saldo pengajuan yang gagal sudah dikembalikan.</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

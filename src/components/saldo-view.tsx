"use client";

import { useActionState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { MIN_WITHDRAWAL } from "@/lib/policy";

type Withdrawal = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  failureReason: string | null;
};

export type SaldoActionState = { error?: string; ok?: boolean } | null;

// Dipake buat Pool owner & Coach -- 2 role beda tapi bentuk fiturnya
// sama persis (liat saldo, isi rekening, cairin, riwayat). Server action
// dioper sebagai prop biar komponen ini gak perlu tau lagi punya siapa.
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
  requestWithdrawalAction: () => Promise<SaldoActionState>;
}) {
  const [bankState, bankAction, bankPending] = useActionState(updateBankInfoAction, null);
  const [cairState, cairAction, cairPending] = useActionState(
    async () => requestWithdrawalAction(),
    null
  );

  const hasBankInfo = !!(bankName && bankAccountNumber && bankAccountName);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardBody className="py-6 text-center">
          <p className="text-sm text-text-muted">Saldo Tersedia</p>
          <p className="mt-1 text-3xl font-semibold text-text">{formatRupiah(walletBalance)}</p>
          <form action={cairAction} className="mt-4">
            <Button
              type="submit"
              disabled={!hasBankInfo || walletBalance < MIN_WITHDRAWAL || cairPending}
              loading={cairPending}
            >
              Cairkan Saldo
            </Button>
          </form>
          {!hasBankInfo ? (
            <p className="mt-2 text-xs text-warning-text">Isi rekening tujuan dulu di bawah.</p>
          ) : (
            walletBalance < MIN_WITHDRAWAL && (
              <p className="mt-2 text-xs text-text-subtle">
                Minimal pencairan {formatRupiah(MIN_WITHDRAWAL)}.
              </p>
            )
          )}
          {cairState?.error && (
            <p role="alert" className="mt-2 text-xs text-danger-text">
              {cairState.error}
            </p>
          )}
          {cairState?.ok && (
            <p role="status" className="mt-2 text-xs text-success-text">
              Pengajuan pencairan berhasil dibuat.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold text-text">Rekening Tujuan Pencairan</h2>
          <form action={bankAction} className="flex flex-col gap-3">
            <Field label="Nama Bank">
              <Input name="bankName" defaultValue={bankName ?? ""} required />
            </Field>
            <Field label="Nomor Rekening">
              <Input name="bankAccountNumber" defaultValue={bankAccountNumber ?? ""} required />
            </Field>
            <Field label="Nama Pemilik Rekening">
              <Input name="bankAccountName" defaultValue={bankAccountName ?? ""} required />
            </Field>
            <Button type="submit" variant="secondary" loading={bankPending} className="w-full">
              Simpan Rekening
            </Button>
          </form>
          {bankState?.error && (
            <p role="alert" className="mt-2 text-xs text-danger-text">
              {bankState.error}
            </p>
          )}
          {bankState?.ok && (
            <p role="status" className="mt-2 text-xs text-success-text">
              Rekening tersimpan.
            </p>
          )}
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Riwayat Pencairan</h2>
        {withdrawals.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center text-sm text-text-muted">
              Belum ada pengajuan pencairan.
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => (
              <Card key={w.id}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{formatRupiah(w.amount)}</p>
                    <p className="text-xs text-text-subtle">
                      {new Date(w.requestedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {w.failureReason && (
                      <p className="mt-1 text-xs text-danger-text">{w.failureReason}</p>
                    )}
                  </div>
                  <Badge
                    tone={
                      w.status === "PAID"
                        ? "success"
                        : w.status === "FAILED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {w.status === "PENDING"
                      ? "Menunggu"
                      : w.status === "PROCESSING"
                        ? "Diproses"
                        : w.status === "PAID"
                          ? "Selesai"
                          : "Gagal"}
                  </Badge>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

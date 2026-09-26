"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Textarea } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { formatRupiah } from "@/lib/format";
import { adjustWallet } from "./actions";

function signed(n: number) {
  return `${n < 0 ? "−" : "+"}${formatRupiah(Math.abs(n))}`;
}

// Formulir koreksi saldo untuk 1 coach / 1 kolam yang sudah dipilih.
export default function AdjustForm({
  targetType,
  targetId,
  targetName,
  balance,
}: {
  targetType: "pool" | "coach";
  targetId: string;
  targetName: string;
  balance: number;
}) {
  const [state, action, pending] = useActionState(adjustWallet, null);
  const form = useRef<HTMLFormElement>(null);
  const [submitKey, setSubmitKey] = useState("");
  const [confirm, setConfirm] = useState<{ amount: number; fromPlatform: boolean } | null>(null);

  function review() {
    const f = form.current;
    if (!f || !f.reportValidity()) return;
    const data = new FormData(f);
    const nominal = Number(data.get("amount"));
    if (!Number.isInteger(nominal) || nominal <= 0) return;
    // Kunci kiriman dibuat saat konfirmasi dibuka: klik "Ya" dua kali tetap
    // tercatat sekali (lihat idempotencyKey di wallet-adjustment.ts).
    setSubmitKey(crypto.randomUUID());
    setConfirm({ amount: data.get("direction") === "debit" ? -nominal : nominal, fromPlatform: data.get("source") === "platform" });
  }

  return (
    <>
      <form key={state?.ok ? state.id : "form"} ref={form} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="idempotencyKey" value={submitKey} readOnly />

        <fieldset className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text">
          <legend className="mb-1 text-sm font-medium text-text">Arah</legend>
          <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0">
            <input type="radio" name="direction" value="credit" required /> Tambah saldo
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0">
            <input type="radio" name="direction" value="debit" required /> Kurangi saldo
          </label>
        </fieldset>

        <Field label="Nominal">
          <PriceInput name="amount" required className="w-full" />
        </Field>

        <Field label="Alasan (tampil ke penerima)">
          <Textarea name="reason" required minLength={5} maxLength={500} rows={2} placeholder="Contoh: Sesi 12 Sep ditandai Hadir padahal batal" />
        </Field>

        <fieldset className="flex flex-col gap-1 text-sm text-text">
          <legend className="mb-1 text-sm font-medium text-text">Sumber dana</legend>
          <label className="flex min-h-[44px] items-start gap-2 sm:min-h-0">
            <input type="radio" name="source" value="none" required className="mt-1" />
            <span>Membetulkan salah catat <span className="text-text-subtle">— tidak ada pihak lain yang ikut berubah</span></span>
          </label>
          <label className="flex min-h-[44px] items-start gap-2 sm:min-h-0">
            <input type="radio" name="source" value="platform" required className="mt-1" />
            <span>Dari/ke pendapatan platform <span className="text-text-subtle">— saldo platform ikut berkurang/bertambah sebesar nominal ini</span></span>
          </label>
        </fieldset>

        <Button type="button" onClick={review} loading={pending} className="self-start">
          Simpan koreksi
        </Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-success-text">Koreksi tersimpan. Notifikasi dikirim ke {targetType === "pool" ? "pemilik kolam" : "coach"} (sampai kalau notifikasi aktif di HP-nya).</p>}
      </form>

      <ConfirmDialog
        open={confirm !== null}
        title={`Koreksi saldo ${targetName}?`}
        description={
          confirm
            ? `${signed(confirm.amount)} → saldo ${formatRupiah(balance)} jadi ${formatRupiah(balance + confirm.amount)}.${
                confirm.fromPlatform ? ` Saldo platform ${confirm.amount > 0 ? "berkurang" : "bertambah"} ${formatRupiah(Math.abs(confirm.amount))}.` : ""
              } Koreksi tidak bisa dihapus; kalau salah, buat koreksi kebalikannya.`
            : ""
        }
        confirmLabel="Ya, simpan"
        confirmVariant="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          form.current?.requestSubmit();
        }}
      />
    </>
  );
}

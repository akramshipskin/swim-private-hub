"use client";

import { useActionState, useState } from "react";
import { addChild, toggleChildActive } from "@/app/profil/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type PesertaItem = {
  id: string;
  name: string;
  isActive: boolean;
  isSelf: boolean;
  // Ringkasan paket aktif peserta ini, sudah dirangkai di server.
  paket: { poolName: string; packageName: string; sisaSesi: number; totalSesi: number }[];
};

// Halaman Peserta dibikin ulang (Hadi 18 Sep: "UI apaan, bikin ambigu").
// Bentuk baru: daftar kartu peserta + paketnya, form tambah terpisah dengan
// pilihan tipe yang jelas, dan peserta nonaktif dipisah di bagian bawah.
export default function PesertaManager({ items }: { items: PesertaItem[] }) {
  const [state, formAction, pending] = useActionState(addChild, null);
  const [type, setType] = useState<"self" | "child">("child");
  const [confirming, setConfirming] = useState<PesertaItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const active = items.filter((c) => c.isActive);
  const inactive = items.filter((c) => !c.isActive);
  const hasSelf = items.some((c) => c.isSelf);

  async function handleDeactivate() {
    if (!confirming) return;
    setDeactivating(true);
    await toggleChildActive(confirming.id, false);
    setDeactivating(false);
    setConfirming(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-text">Peserta aktif</h2>
        {active.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center text-sm text-text-muted">
              Belum ada peserta. Tambahkan di bawah — bisa kamu sendiri, bisa anak.
            </CardBody>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {active.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardBody className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-text">{c.name}</p>
                        <p className="text-xs text-text-subtle">{c.isSelf ? "Kamu sendiri" : "Anak"}</p>
                      </div>
                      <Badge tone="success">Aktif</Badge>
                    </div>

                    {c.paket.length === 0 ? (
                      <p className="text-sm text-text-muted">Belum punya paket aktif.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {c.paket.map((p, i) => (
                          <li key={i} className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                            <span className="font-semibold text-brand-700">{p.poolName}</span>
                            <span className="text-text-muted"> · {p.packageName}</span>
                            <br />
                            <span className="text-text">
                              Sisa <b>{p.sisaSesi}</b> dari {p.totalSesi} sesi
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirming(c)}
                      className="mt-auto self-start text-sm font-medium text-danger-text hover:underline"
                    >
                      Nonaktifkan peserta
                    </button>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-text">Tambah peserta</h2>
        <Card>
          <CardBody>
            <form action={formAction} className="flex flex-col gap-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-text">Peserta ini siapa?</legend>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input type="radio" name="type" value="child" checked={type === "child"} onChange={() => setType("child")} />
                  Anak saya
                </label>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="radio"
                    name="type"
                    value="self"
                    checked={type === "self"}
                    disabled={hasSelf}
                    onChange={() => setType("self")}
                  />
                  Saya sendiri {hasSelf && <span className="text-xs text-text-subtle">(sudah terdaftar)</span>}
                </label>
              </fieldset>

              {type === "child" && (
                <Field label="Nama anak">
                  <Input name="name" placeholder="Nama lengkap anak" required className="sm:max-w-sm" />
                </Field>
              )}

              <Button type="submit" loading={pending} className="w-full sm:w-auto">
                Tambah peserta
              </Button>

              {state?.error && (
                <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                  {state.error}
                </p>
              )}
            </form>
          </CardBody>
        </Card>
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">Peserta nonaktif</h2>
          <p className="mb-2 text-sm text-text-muted">
            Paket dan riwayatnya disimpan. Aktifkan lagi kalau peserta ini mau les lagi.
          </p>
          <ul className="flex flex-col gap-2">
            {inactive.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-3 py-2"
              >
                <span className="text-sm text-text-subtle">
                  {c.name}
                  {c.isSelf && " (kamu sendiri)"}
                </span>
                <Button type="button" size="sm" variant="secondary" onClick={() => toggleChildActive(c.id, true)}>
                  Aktifkan
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={`Nonaktifkan ${confirming?.name}?`}
        description="Paket & booking peserta ini tidak bisa diakses lagi sampai diaktifkan ulang."
        confirmLabel="Ya, nonaktifkan"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

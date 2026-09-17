"use client";

import { useActionState, useState } from "react";
import { assignPackageToMember } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string | null; phone: string | null };
type Template = { id: string; name: string; totalSesi: number; jatahCancel: number; poolId: string };
type Dependent = { id: string; name: string; memberId: string; isSelf: boolean };
type PoolOption = { id: string; name: string };

export default function AssignPackageForm({
  members,
  templates,
  dependents,
  pools,
}: {
  members: Member[];
  templates: Template[];
  dependents: Dependent[];
  pools: PoolOption[];
}) {
  const [state, formAction, pending] = useActionState(assignPackageToMember, null);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [name, setName] = useState("");
  const [totalSesi, setTotalSesi] = useState("");
  const [jatahCancel, setJatahCancel] = useState("2");
  // Paket wajib pin ke 1 kolam. Dari katalog -> ikut kolam template
  // (dikunci di UI, server juga maksa ini walau dikirim beda). Custom
  // -> admin pilih kolam manual.
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const childrenOfMember = dependents.filter((d) => d.memberId === memberId);

  return (
    <Card className="mb-8">
      <CardBody>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Field label="Member">
            <Select
              name="memberId"
              required
              className="w-full sm:w-52"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email ?? m.phone ?? "-"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Peserta">
            {childrenOfMember.length === 0 ? (
              <p className="text-xs text-danger-text">
                Member ini belum punya peserta terdaftar, tambahkan dulu di atas.
              </p>
            ) : (
              <Select name="dependentId" required className="w-full sm:w-40">
                {childrenOfMember.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.isSelf ? `${d.name} (diri sendiri)` : d.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Dari Katalog (opsional)">
            <Select
              name="templateId"
              className="w-full sm:w-72"
              value={templateId}
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value);
                setTemplateId(e.target.value);
                setName(t ? t.name : "");
                setTotalSesi(t ? String(t.totalSesi) : "");
                setJatahCancel(t ? String(t.jatahCancel) : "2");
                if (t) setPoolId(t.poolId);
              }}
            >
              <option value="">-- custom --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {/* Nama paket bisa sama persis antar kolam (harga beda) --
                      tanpa nama kolam, 2 opsi kebaca identik. */}
                  {t.name} — {pools.find((p) => p.id === t.poolId)?.name ?? "kolam ?"}
                </option>
              ))}
            </Select>
          </Field>
          {/* Paket dari katalog sudah terikat ke kolamnya sendiri, jadi
              pilihan kolam tidak ditampilkan -- dulu tampil tapi mati, dan itu
              membingungkan (Hadi 18 Sep). Kolam hanya dipilih untuk paket custom. */}
          <Field label="Kolam">
            {templateId ? (
              <>
                <p className="flex min-h-[44px] items-center rounded-xl border border-border bg-surface-muted px-3 text-sm text-text-muted">
                  {pools.find((p) => p.id === poolId)?.name ?? "-"} <span className="ml-1 text-xs">(ikut katalog)</span>
                </p>
                <input type="hidden" name="poolId" value={poolId} />
              </>
            ) : (
              <Select
                name="poolId"
                required
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                className="w-full sm:w-36"
              >
                {pools.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Nama Paket">
            <Input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full sm:w-40"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Field label="Total Sesi">
              <Input
                type="number"
                name="totalSesi"
                required
                min={1}
                value={totalSesi}
                onChange={(e) => setTotalSesi(e.target.value)}
                className="w-full sm:w-20"
              />
            </Field>
            <Field label="Jatah Cancel">
              <Input
                type="number"
                name="jatahCancel"
                min={0}
                value={jatahCancel}
                onChange={(e) => setJatahCancel(e.target.value)}
                className="w-full sm:w-24"
              />
            </Field>
          </div>
          <Field label="Berlaku Sampai (opsional)">
            <DatePicker name="expiredDate" className="sm:w-40" clearable />
          </Field>
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Assign (langsung Aktif)
          </Button>
        </form>
        {state?.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {state.error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { useActionState, useState } from "react";
import { assignPackageToMember } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string | null; phone: string | null };
type Dependent = { id: string; name: string; memberId: string; isSelf: boolean };
type PoolOption = { id: string; name: string };
type CoachOption = { id: string; name: string; poolIds: string[] };

// Paket manual memakai model harga-dari-coach: peserta + kolam + coach + 4/8
// sesi. Harga, masa berlaku, dan jatah batal dihitung server dari harga kolam &
// coach saat ini; paket ini tidak membagi uang (tidak ada pembayaran).
export default function AssignPackageForm({
  members,
  dependents,
  pools,
  coaches,
}: {
  members: Member[];
  dependents: Dependent[];
  pools: PoolOption[];
  coaches: CoachOption[];
}) {
  const [state, formAction, pending] = useActionState(assignPackageToMember, null);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const childrenOfMember = dependents.filter((d) => d.memberId === memberId);
  const coachesOfPool = coaches.filter((c) => c.poolIds.includes(poolId));

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
                Member ini belum punya peserta. Tambahkan peserta di formulir atas.
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
          <Field label="Kolam">
            <Select name="poolId" required value={poolId} onChange={(e) => setPoolId(e.target.value)} className="w-full sm:w-44">
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Coach">
            {coachesOfPool.length === 0 ? (
              <p className="text-xs text-danger-text">Belum ada coach aktif di kolam ini.</p>
            ) : (
              <Select key={poolId} name="coachId" required className="w-full sm:w-44">
                {coachesOfPool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Paket">
            <Select name="sesi" required defaultValue="4" className="w-full sm:w-32">
              <option value="4">4 sesi</option>
              <option value="8">8 sesi</option>
            </Select>
          </Field>
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Berikan paket (langsung Aktif)
          </Button>
        </form>
        <p className="mt-3 text-xs text-text-subtle">
          Harga, masa berlaku, dan jatah batal mengikuti harga kolam + coach saat ini. Paket ini gratis untuk member,
          jadi sesinya tidak membagi uang ke kolam, coach, atau SPH.
        </p>
        {state?.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" className="mt-3 rounded-lg bg-success-bg px-3 py-2 text-sm text-success-text">
            {state.success}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

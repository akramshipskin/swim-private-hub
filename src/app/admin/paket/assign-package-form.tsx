"use client";

import { useActionState, useState } from "react";
import { assignPackageToMember } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string | null; phone: string | null };
type Template = { id: string; name: string; totalSesi: number; jatahCancel: number };
type Dependent = { id: string; name: string; memberId: string; isSelf: boolean };

export default function AssignPackageForm({
  members,
  templates,
  dependents,
}: {
  members: Member[];
  templates: Template[];
  dependents: Dependent[];
}) {
  const [state, formAction, pending] = useActionState(assignPackageToMember, null);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [name, setName] = useState("");
  const [totalSesi, setTotalSesi] = useState("");
  const [jatahCancel, setJatahCancel] = useState("2");
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
                Member ini belum punya peserta terdaftar, tambahin dulu di atas.
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
              className="w-full sm:w-44"
              defaultValue=""
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value);
                setName(t ? t.name : "");
                setTotalSesi(t ? String(t.totalSesi) : "");
                setJatahCancel(t ? String(t.jatahCancel) : "2");
              }}
            >
              <option value="">-- custom --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
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
            <Input type="date" name="expiredDate" className="max-w-full sm:w-40" />
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

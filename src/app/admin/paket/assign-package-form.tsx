"use client";

import { useActionState } from "react";
import { assignPackageToMember } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string | null; phone: string | null };
type Template = { id: string; name: string };

export default function AssignPackageForm({
  members,
  templates,
}: {
  members: Member[];
  templates: Template[];
}) {
  const [state, formAction, pending] = useActionState(assignPackageToMember, null);

  return (
    <Card className="mb-8">
      <CardBody>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <Field label="Member">
            <Select name="memberId" required className="w-52">
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email ?? m.phone ?? "-"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dari Katalog (opsional)">
            <Select name="templateId" className="w-44" defaultValue="">
              <option value="">-- custom --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Paket">
            <Input name="name" required className="w-40" />
          </Field>
          <Field label="Total Sesi">
            <Input type="number" name="totalSesi" required min={1} className="w-20" />
          </Field>
          <Field label="Berlaku Sampai (opsional)">
            <Input type="date" name="expiredDate" className="w-40" />
          </Field>
          <Button type="submit" loading={pending}>
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

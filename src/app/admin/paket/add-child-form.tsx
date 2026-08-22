"use client";

import { useActionState, useState } from "react";
import { addChildForMember } from "./actions";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

type Member = { id: string; name: string; email: string | null; phone: string | null };

export default function AddChildForm({ members }: { members: Member[] }) {
  const [state, formAction, pending] = useActionState(addChildForMember, null);
  const [type, setType] = useState<"self" | "child">("child");

  return (
    <Card className="mb-8">
      <CardBody>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Field label="Member (ortu)">
            <Select name="memberId" required className="w-full sm:w-56">
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email ?? m.phone ?? "-"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipe">
            <Select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as "self" | "child")}
              className="w-full sm:w-32"
            >
              <option value="child">Anak</option>
              <option value="self">Diri sendiri</option>
            </Select>
          </Field>
          {type === "child" && (
            <Field label="Nama Anak">
              <Input name="name" required className="w-full sm:w-48" />
            </Field>
          )}
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Tambah
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

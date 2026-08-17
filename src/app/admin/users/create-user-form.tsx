"use client";

import { useActionState } from "react";
import { createUser } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, null);

  return (
    <Card className="mb-6">
      <CardBody>
        <h2 className="mb-4 text-sm font-semibold text-text">Tambah User Baru</h2>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid grid-cols-1 gap-3 sm:contents">
            <Field label="Nama">
              <Input name="name" required className="w-full sm:w-40" />
            </Field>
            <Field label="No HP">
              <Input type="tel" name="phone" placeholder="0812xxxxxxx" required className="w-full sm:w-40" />
            </Field>
            <Field label="Email (opsional)">
              <Input type="email" name="email" className="w-full sm:w-52" />
            </Field>
            <Field label="Password">
              <Input type="password" name="password" required minLength={8} className="w-full sm:w-40" />
            </Field>
            <Field label="Role">
              <Select name="role" required defaultValue="MEMBER" className="w-full sm:w-32">
                <option value="MEMBER">Member</option>
                <option value="COACH">Coach</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>
          </div>
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

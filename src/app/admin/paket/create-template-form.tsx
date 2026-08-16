"use client";

import { useActionState } from "react";
import { createTemplate } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateTemplateForm() {
  const [state, formAction, pending] = useActionState(createTemplate, null);

  return (
    <Card className="mb-4">
      <CardBody>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <Field label="Nama Paket">
            <Input name="name" required className="w-44" />
          </Field>
          <Field label="Total Sesi">
            <Input type="number" name="totalSesi" required min={1} className="w-24" />
          </Field>
          <Field label="Harga (Rp)">
            <Input type="number" name="price" required min={0} className="w-32" />
          </Field>
          <Button type="submit" loading={pending}>
            Tambah Katalog
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

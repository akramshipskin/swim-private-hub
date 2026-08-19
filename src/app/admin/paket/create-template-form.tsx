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
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Field label="Nama Paket">
            <Input name="name" required className="w-full sm:w-44" />
          </Field>
          <Field label="Harga (Rp)">
            <Input type="number" name="price" required min={0} className="w-full sm:w-32" />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Field label="Total Sesi">
              <Input type="number" name="totalSesi" required min={1} className="w-full sm:w-24" />
            </Field>
            <Field label="Jatah Cancel">
              <Input type="number" name="jatahCancel" required min={0} defaultValue={2} className="w-full sm:w-24" />
            </Field>
          </div>
          <div className="grid grid-cols-2 items-end gap-3 sm:contents">
            <Field label="Berlaku (hari)">
              <Input type="number" name="durationDays" required min={1} defaultValue={60} className="w-full sm:w-24" />
            </Field>
            <Button type="submit" loading={pending} className="w-full sm:w-auto">
              Tambah Katalog
            </Button>
          </div>
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

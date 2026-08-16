"use client";

import { useActionState } from "react";
import { updateTemplate } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Template = {
  id: string;
  name: string;
  totalSesi: number;
  price: number;
  isActive: boolean;
};

export default function TemplateEditForm({ template }: { template: Template }) {
  const [state, formAction, pending] = useActionState(updateTemplate, null);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="templateId" value={template.id} />
          <Field label="Nama">
            <Input name="name" defaultValue={template.name} className="w-40" />
          </Field>
          <Field label="Total Sesi">
            <Input type="number" name="totalSesi" defaultValue={template.totalSesi} min={1} className="w-20" />
          </Field>
          <Field label="Harga (Rp)">
            <Input type="number" name="price" defaultValue={template.price} min={0} className="w-32" />
          </Field>
          <div className="flex items-center gap-1.5 pb-2">
            <input
              type="checkbox"
              name="isActive"
              id={`active-${template.id}`}
              defaultChecked={template.isActive}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor={`active-${template.id}`} className="text-sm text-text">
              Aktif
            </Label>
          </div>
          <Button type="submit" variant="secondary" size="sm" loading={pending}>
            Simpan
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

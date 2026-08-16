"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // Tombol Simpan nempatin posisi klik yang sama kayak Edit sebelumnya --
  // kalau user klik ganda cepat (mikir klik pertama gak kena), klik kedua
  // bisa numbuk Simpan tanpa sengaja. Simpan di-disable sesaat abis masuk
  // mode edit biar klik ganda gak ke-submit sendiri.
  const [justEnteredEdit, setJustEnteredEdit] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function startEdit() {
    setIsEditing(true);
    setJustEnteredEdit(true);
    setTimeout(() => setJustEnteredEdit(false), 400);
  }

  function cancel() {
    setIsEditing(false);
    // Reset uncontrolled field ke defaultValue asli -- ganti key biar
    // React remount form-nya, bukan cuma nge-disable field yang masih
    // nyimpen input user sebelumnya.
    setFormKey((k) => k + 1);
  }

  const locked = !isEditing;

  return (
    <Card>
      <CardBody>
        <form key={formKey} action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="templateId" value={template.id} />
          <Field label="Nama">
            <Input name="name" defaultValue={template.name} disabled={locked} className="w-40" />
          </Field>
          <Field label="Total Sesi">
            <Input
              type="number"
              name="totalSesi"
              defaultValue={template.totalSesi}
              min={1}
              disabled={locked}
              className="w-20"
            />
          </Field>
          <Field label="Harga (Rp)">
            <Input
              type="number"
              name="price"
              defaultValue={template.price}
              min={0}
              disabled={locked}
              className="w-32"
            />
          </Field>
          <div className="flex items-center gap-1.5 pb-2">
            <input
              type="checkbox"
              name="isActive"
              id={`active-${template.id}`}
              defaultChecked={template.isActive}
              disabled={locked}
              className="h-4 w-4 rounded border-border disabled:opacity-50"
            />
            <Label htmlFor={`active-${template.id}`} className="text-sm text-text">
              Aktif
            </Label>
          </div>

          {locked ? (
            <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
              Edit
            </Button>
          ) : (
            <>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={pending}
                disabled={justEnteredEdit}
              >
                Simpan
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={cancel}>
                Batal
              </Button>
            </>
          )}
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

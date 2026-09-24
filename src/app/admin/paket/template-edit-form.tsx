"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateTemplate } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

type Template = {
  id: string;
  name: string;
  totalSesi: number;
  price: number;
  durationDays: number;
  jatahCancel: number;
  isActive: boolean;
};

type TemplateAction = (state: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;

export default function TemplateEditForm({ template, action = updateTemplate, submitLabel = "Simpan" }: { template: Template; action?: TemplateAction; submitLabel?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
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
        {/* Terkunci = ringkasan 1-2 baris (Hadi: kartu paket terlalu makan
            tempat). Semua isian baru muncul setelah klik Edit. */}
        {locked ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-snug text-text">{template.name}</h3>
                <p className="mt-1 text-xl font-bold leading-tight text-text">{formatRupiah(template.price)}</p>
                <p className="mt-0.5 text-sm text-text-muted">
                  {formatRupiah(Math.round(template.price / template.totalSesi))} per sesi
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
                Edit
              </Button>
            </div>
            {/* Spesifikasi turun ke bawah sebagai badge (Hadi 18 Sep v3) --
                sebelumnya nempel jadi satu kalimat panjang dipisah titik
                tengah, kebaca sebagai paragraf, bukan sebagai spek. */}
            <ul className="flex flex-wrap gap-1.5">
              <li><Badge tone="brand">{template.totalSesi} sesi</Badge></li>
              <li><Badge tone="neutral">Berlaku {template.durationDays} hari</Badge></li>
              <li><Badge tone="neutral">Jatah batal {template.jatahCancel}×</Badge></li>
              {!template.isActive && <li><Badge tone="warning">Tidak dijual</Badge></li>}
            </ul>
          </div>
        ) : (
        <form
          key={formKey}
          action={formAction}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <input type="hidden" name="templateId" value={template.id} />
          <Field label="Nama">
            <Input name="name" defaultValue={template.name} className="w-full sm:w-44" />
          </Field>
          <Field label="Harga (Rp)">
            <PriceInput
              name="price"
              defaultValue={template.price}
             
              className="w-full sm:w-32"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Field label="Total Sesi">
              <Input
                type="number"
                name="totalSesi"
                defaultValue={template.totalSesi}
                min={1}
               
                className="w-full sm:w-24"
              />
            </Field>
            <Field label="Jatah Batal">
              <Input
                type="number"
                name="jatahCancel"
                defaultValue={template.jatahCancel}
                required
                min={0}
               
                className="w-full sm:w-24"
              />
            </Field>
          </div>
          <Field label="Berlaku (hari)">
            <Input
              type="number"
              name="durationDays"
              defaultValue={template.durationDays}
              min={1}
             
              className="w-full sm:w-24"
            />
          </Field>
          <div className="flex items-center gap-1.5 sm:pb-2">
            <input
              type="checkbox"
              name="isActive"
              id={`active-${template.id}`}
              defaultChecked={template.isActive}
             
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500 disabled:opacity-50"
            />
            <Label htmlFor={`active-${template.id}`} className="text-sm text-text">
              Aktif
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={pending}
              disabled={justEnteredEdit}
            >
              {submitLabel}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={cancel}>
              Batal
            </Button>
          </div>
          {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
        </form>
        )}
      </CardBody>
    </Card>
  );
}

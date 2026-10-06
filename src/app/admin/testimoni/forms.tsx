"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TESTIMONIAL_LIMITS } from "@/lib/testimonial";
import { addTestimonial, updateTestimonial, type TestimonialActionState } from "./actions";

function Status({ state }: { state: TestimonialActionState }) {
  if (state?.error) return <p role="alert" className="text-xs text-danger-text">{state.error}</p>;
  if (state?.success) return <p role="status" className="text-xs text-success-text">Tersimpan.</p>;
  return null;
}

type Values = { name: string; role: string; quote: string; consentNote: string; sortOrder?: number };

function Fields({ v }: { v?: Values }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Nama">
          <Input name="name" defaultValue={v?.name} maxLength={TESTIMONIAL_LIMITS.name} required placeholder="Ibu Clara" />
        </Field>
        <Field label="Peran">
          <Input name="role" defaultValue={v?.role} maxLength={TESTIMONIAL_LIMITS.role} required placeholder="Orang tua peserta" />
        </Field>
      </div>
      <Field label="Kutipan (Persis Kata Mereka)">
        <Textarea name="quote" defaultValue={v?.quote} maxLength={TESTIMONIAL_LIMITS.quote} rows={4} required />
      </Field>
      <Field label="Catatan izin (siapa mengizinkan, kapan, lewat apa)">
        <Input name="consentNote" defaultValue={v?.consentNote} maxLength={TESTIMONIAL_LIMITS.consentNote} required placeholder="Izin lewat WhatsApp, 30 Sep 2026" />
      </Field>
    </>
  );
}

export function AddTestimonialForm() {
  const [state, action, pending] = useActionState(addTestimonial, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Fields />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>Tambah Testimoni</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function EditTestimonialForm({ id, values }: { id: string; values: Required<Values> }) {
  const [state, action, pending] = useActionState(updateTestimonial.bind(null, id), null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Fields v={values} />
      <div className="flex flex-wrap items-center gap-3">
        <Field label="Urutan">
          <Input name="sortOrder" type="number" min={0} max={999} defaultValue={values.sortOrder} className="w-24" />
        </Field>
        <Button type="submit" size="sm" variant="secondary" loading={pending}>Simpan Perubahan</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

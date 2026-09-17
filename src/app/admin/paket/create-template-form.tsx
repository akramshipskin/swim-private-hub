"use client";

import { useActionState } from "react";
import { createTemplate } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Button } from "@/components/ui/button";

type PoolOption = { id: string; name: string };

export default function CreateTemplateForm({ pools }: { pools: PoolOption[] }) {
  const [state, formAction, pending] = useActionState(createTemplate, null);

  return (
    <Card className="mb-4">
      <CardBody>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Katalog paket sekarang per-kolam (locked /plan-eng-review
              2026-09-12) -- tiap kolam pasang harga sendiri. Phase 1 gak
              punya admin per-pool, jadi founder (superadmin) yang pilih
              kolam mana di sini. */}
          <Field label="Kolam">
            <Select name="poolId" required className="w-full sm:w-60">
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Paket">
            <Input name="name" required className="w-full sm:w-44" />
          </Field>
          <Field label="Harga (Rp)">
            <PriceInput name="price" required className="w-full sm:w-32" />
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

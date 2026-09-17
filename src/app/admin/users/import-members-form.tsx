"use client";

import { useActionState, useState } from "react";
import { importMembersXlsx } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PoolOption = { id: string; name: string };

export default function ImportMembersForm({ pools }: { pools: PoolOption[] }) {
  const [state, formAction, pending] = useActionState(importMembersXlsx, null);
  const [hasFile, setHasFile] = useState(false);

  return (
    <Card>
      <CardBody>
        <h2 className="mb-1 text-sm font-semibold text-text">Import Users dari xlsx</h2>
        <p className="mb-2 text-xs text-text-subtle">
          Kolom: Nama Member, No HP, Email (opsional), Nama Peserta/Anak, Paket Aktif,
          Sisa Sesi. 1 baris = 1 peserta — member dengan &gt;1 anak, ulang No HP yang
          sama di baris berikutnya. Member baru login pakai No HP + password default
          yang sama, wajib ganti pas login pertama. 1 file = 1 kolam tujuan — kalau
          data kamu lintas kolam, pisah filenya dan import satu-satu per kolam.
        </p>
        <a
          href="/api/admin/import-template"
          className="mb-4 inline-block text-xs font-medium text-brand-600 hover:underline"
        >
          Download Template
        </a>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <Field label="Kolam tujuan">
            <Select name="poolId" required className="w-40">
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
            className="text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
          <Button type="submit" disabled={!hasFile} loading={pending}>
            Import
          </Button>
        </form>
        {state?.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {state.error}
          </p>
        )}
        {state?.result && (
          <p role="status" className="mt-3 rounded-lg bg-success-bg px-3 py-2 text-sm text-success-text">
            {state.result}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

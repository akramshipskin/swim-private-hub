"use client";

import { useActionState } from "react";
import { importMembersXlsx } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportMembersForm() {
  const [state, formAction, pending] = useActionState(importMembersXlsx, null);

  return (
    <Card className="mb-6">
      <CardBody>
        <h2 className="mb-1 text-sm font-semibold text-text">Import Member dari xlsx</h2>
        <p className="mb-4 text-xs text-text-subtle">
          Kolom: Nama, No HP. Member baru login pakai No HP + password default yang
          sama, wajib ganti password pas login pertama.
        </p>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            className="text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
          <Button type="submit" loading={pending}>
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

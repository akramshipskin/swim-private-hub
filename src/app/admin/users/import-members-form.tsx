"use client";

import { useActionState, useState } from "react";
import { importMembersXlsx, type ImportCredential } from "./actions";
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
        <h2 className="mb-1 text-sm font-semibold text-text">Import Pengguna dari xlsx</h2>
        <p className="mb-2 text-xs text-text-subtle">
          Kolom: Nama Member, No HP, Email (opsional), Nama Peserta/Anak, Paket Aktif,
          Sisa Sesi. 1 baris = 1 peserta — member dengan &gt;1 anak, ulang No HP yang
          sama di baris berikutnya. Tiap member baru dapat password sementara acak
          (muncul di tabel setelah import), wajib ganti saat pertama masuk. 1 file = 1 kolam tujuan — kalau
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
            className="w-full min-w-0 max-w-full text-sm text-text sm:w-auto file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#0a0a08]"
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
        {state?.credentials && state.credentials.length > 0 && <CredentialsTable rows={state.credentials} />}
      </CardBody>
    </Card>
  );
}

// Password sementara hanya tampil sekali (tidak disimpan di server). Unduh
// CSV/catat sebelum menutup halaman, lalu kirim ke tiap member lewat WA.
function CredentialsTable({ rows }: { rows: ImportCredential[] }) {
  function downloadCsv() {
    const csv = ["Nama,No HP,Password sementara", ...rows.map((r) => [r.name, r.phone, r.password].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "password-sementara-member.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-3 rounded-lg border border-warning-text/30 bg-warning-bg px-3 py-3">
      <p className="text-sm font-medium text-warning-text">
        Simpan sekarang: password ini tidak bisa dilihat lagi setelah halaman ditutup.
      </p>
      <Button type="button" variant="secondary" size="sm" onClick={downloadCsv} className="mt-2">
        Unduh CSV
      </Button>
      <div className="mt-3 max-h-72 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-subtle">
            <tr>
              <th className="py-1 pr-3 font-medium">Nama</th>
              <th className="py-1 pr-3 font-medium">No HP</th>
              <th className="py-1 font-medium">Password sementara</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.phone} className="border-t border-border">
                <td className="py-1 pr-3 text-text">{r.name}</td>
                <td className="py-1 pr-3 text-text">{r.phone}</td>
                <td className="py-1 font-mono text-text">{r.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

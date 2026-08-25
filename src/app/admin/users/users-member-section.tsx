"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PesertaList, UserActions, type PesertaRow } from "./user-display";

type Row = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  peserta: PesertaRow[];
};

export default function UsersMemberSection({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter((u) => {
        const q = search.trim().toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.phone?.toLowerCase().includes(q) ?? false) ||
          u.peserta.some((p) => p.label.toLowerCase().includes(q))
        );
      })
    : rows;

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-text-muted">
        Member <span className="text-text-subtle">({rows.length})</span>
      </h2>
      <Input
        type="search"
        placeholder="Cari nama, email, No HP, atau nama anak..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle">Gak ada yang cocok sama pencarian &ldquo;{search}&rdquo;.</p>
      ) : (
        <>
          {/* Desktop: tabel -- Nama & Email digabung 1 kolom (email di
              bawah nama) biar kolom gak sesek, kolom sisanya dapet napas
              lebih (padding naik dikit). */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                    <th className="px-5 py-3.5 font-medium">Nama</th>
                    <th className="px-5 py-3.5 font-medium">No HP</th>
                    <th className="w-72 px-5 py-3.5 font-medium">Paket</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium text-text">{u.name}</p>
                        {u.email && <p className="text-xs text-text-subtle">{u.email}</p>}
                      </td>
                      <td className="px-5 py-4 text-text-muted">{u.phone ?? "-"}</td>
                      <td className="w-72 px-5 py-4 text-xs text-text-muted">
                        <PesertaList items={u.peserta} />
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={u.isActive ? "success" : "neutral"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <UserActions user={u} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: card compact biasa -- semua info langsung keliatan,
              gak perlu di-tap buat expand. */}
          <ul className="flex flex-col gap-1.5 sm:hidden">
            {filtered.map((u) => (
              <Card key={u.id}>
                <CardBody className="flex flex-col gap-1.5 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-text">{u.name}</p>
                    <Badge tone={u.isActive ? "success" : "neutral"}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {u.email && <p className="text-xs text-text-subtle">{u.email}</p>}
                  <p className="text-xs text-text-muted">No HP: {u.phone ?? "-"}</p>
                  <div className="text-xs text-text-muted">
                    <PesertaList items={u.peserta} />
                  </div>
                  <UserActions user={u} />
                </CardBody>
              </Card>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

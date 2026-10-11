"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PesertaList, UserActions, type PesertaRow } from "./user-display";
import Link from "next/link";

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
  // Ratusan member: tampil 30 dulu, tombol menambah 30 (pencarian tetap ke semua member).
  const [limit, setLimit] = useState(30);

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
  const shown = filtered.slice(0, limit);

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-text-muted">
        Member <span className="text-text-subtle">({rows.length})</span>
      </h2>
      <Input
        type="search"
        placeholder="Cari nama, email, Nomor HP, atau nama peserta..."
        aria-label="Cari member"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setLimit(30);
        }}
        className="mb-3 max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle">Tidak ada yang cocok dengan pencarian &ldquo;{search}&rdquo;.</p>
      ) : (
        <>
          {/* Desktop: tabel -- Nama & Email digabung 1 kolom (email di
              bawah nama) biar kolom gak sesek, kolom sisanya dapet napas
              lebih (padding naik dikit). */}
          <Card className="hidden xl:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                    <th className="px-5 py-3.5 font-medium">Nama</th>
                    <th className="w-56 px-5 py-3.5 font-medium">Paket</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <Link href={`/admin/users/${u.id}`} className="font-medium text-text hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                          {u.name}
                        </Link>
                        {u.email && <p className="text-xs text-text-subtle">{u.email}</p>}
                        <p className="text-xs text-text-subtle">{u.phone ?? "Nomor HP belum diisi"}</p>
                      </td>
                      <td className="w-56 px-5 py-4 text-xs text-text-muted">
                        <PesertaList items={u.peserta} />
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={u.isActive ? "success" : "neutral"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      {/* Satu baris (dulu bertumpuk 3 baris); detail lewat nama member. */}
                      <td className="px-5 py-4 text-right whitespace-nowrap [&>div]:flex-nowrap">
                        <UserActions user={u} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: card compact biasa -- semua info langsung keliatan,
              gak perlu di-tap buat expand. */}
          <ul className="flex flex-col gap-1.5 xl:hidden">
            {shown.map((u) => (
              <Card key={u.id}>
                <CardBody className="flex flex-col gap-1.5 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/users/${u.id}`} className="min-w-0 truncate text-sm font-medium text-text underline-offset-2 hover:underline max-sm:py-3">
                      {u.name}
                    </Link>
                    <Badge tone={u.isActive ? "success" : "neutral"}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {u.email && <p className="text-xs text-text-subtle">{u.email}</p>}
                  <p className="text-xs text-text-muted">Nomor HP: {u.phone ?? "-"}</p>
                  <div className="text-xs text-text-muted">
                    <PesertaList items={u.peserta} />
                  </div>
                  <UserActions user={u} />
                </CardBody>
              </Card>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-text-subtle">
            {shown.length} dari {filtered.length} member{search.trim() ? " yang cocok" : ""}
          </p>
          {shown.length < filtered.length && (
            <button
              type="button"
              onClick={() => setLimit((n) => n + 30)}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted"
            >
              Tampilkan Lebih Banyak
            </button>
          )}
        </>
      )}
    </div>
  );
}

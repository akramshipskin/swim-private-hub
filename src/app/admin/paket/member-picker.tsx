"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/input";

type Member = { id: string; name: string; email: string | null; phone: string | null };

// Pilih member dari ratusan nama: ketik dulu untuk menyaring, lalu pilih.
// Dulu satu daftar pilihan berisi semua member (ratusan baris di HP).
export default function MemberPicker({
  members,
  label = "Member",
  value,
  onChange,
}: {
  members: Member[];
  label?: string;
  value?: string;
  onChange?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (q ? members.filter((m) => `${m.name} ${m.email ?? ""} ${m.phone ?? ""}`.toLowerCase().includes(q)) : members).slice(0, 50);
  const [own, setOwn] = useState(members[0]?.id ?? "");
  const selected = value ?? own;
  const pick = (id: string) => (onChange ? onChange(id) : setOwn(id));
  // Pilihan yang sedang terpilih tetap ada walau tersaring keluar.
  const options = matches.some((m) => m.id === selected) ? matches : [...members.filter((m) => m.id === selected), ...matches];
  return (
    <div className="flex flex-col gap-2 sm:w-64">
      <Field label={`Cari ${label}`}>
        <Input
          type="search"
          value={query}
          placeholder="Ketik nama, email, atau Nomor HP"
          onChange={(e) => {
            setQuery(e.target.value);
            const first = members.find((m) => `${m.name} ${m.email ?? ""} ${m.phone ?? ""}`.toLowerCase().includes(e.target.value.trim().toLowerCase()));
            if (first && e.target.value.trim()) pick(first.id);
          }}
          className="w-full"
        />
      </Field>
      <Field label={label}>
        <Select name="memberId" required className="w-full" value={selected} onChange={(e) => pick(e.target.value)}>
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email ?? m.phone ?? "-"})
            </option>
          ))}
        </Select>
      </Field>
      {q && matches.length === 0 && <p className="text-xs text-danger-text">Tidak ada member yang cocok.</p>}
    </div>
  );
}

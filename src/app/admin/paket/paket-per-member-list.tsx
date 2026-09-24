"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import MemberCard from "./package-member-card";

type PesertaPkg = {
  id: string;
  name: string;
  poolName: string;
  sisaSesi: number;
  totalSesi: number;
  jatahCancel: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  expiredDate: Date | null;
  expiredDateInput: string;
  cancelRemaining: number;
};

type Peserta = {
  dependentId: string;
  label: string;
  pkg: PesertaPkg | null;
};

type Row = {
  memberId: string;
  memberName: string;
  memberContact: string;
  memberSinceLabel: string;
  peserta: Peserta[];
};

export default function PaketPerMemberList({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter((r) => {
        const q = search.trim().toLowerCase();
        return r.memberName.toLowerCase().includes(q) || r.peserta.some((p) => p.label.toLowerCase().includes(q) || (p.pkg?.poolName.toLowerCase().includes(q) ?? false));
      })
    : rows;

  return (
    <>
      <Input
        type="search"
        placeholder="Cari nama akun, peserta, atau kolam..."
        aria-label="Cari paket per member"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle">Tidak ada yang cocok sama pencarian &ldquo;{search}&rdquo;.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.memberId}>
              <MemberCard
                memberName={r.memberName}
                memberContact={r.memberContact}
                memberSinceLabel={r.memberSinceLabel}
                peserta={r.peserta}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

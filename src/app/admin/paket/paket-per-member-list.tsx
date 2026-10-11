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
  refund?: { cashPaid: number; saldoPaid: number; refundedAt: Date | null; refundCash: number | null; refundSaldo: number | null };
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
  // Banyak member: tampil 20 dulu, tombol menambah 20 (pencarian tetap ke semua).
  const [limit, setLimit] = useState(20);

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
        onChange={(e) => {
          setSearch(e.target.value);
          setLimit(20);
        }}
        className="mb-3 max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle">Tidak ada yang cocok dengan pencarian &ldquo;{search}&rdquo;.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.slice(0, limit).map((r) => (
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
      {filtered.length > 0 && (
        <p className="mt-3 text-center text-xs text-text-subtle">
          {Math.min(limit, filtered.length)} dari {filtered.length} member
        </p>
      )}
      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + 20)}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted"
        >
          Tampilkan Lebih Banyak
        </button>
      )}
    </>
  );
}

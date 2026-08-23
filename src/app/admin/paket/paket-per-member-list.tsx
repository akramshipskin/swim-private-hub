"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import PackageMemberCard from "./package-member-card";

type Row = {
  id: string;
  memberName: string;
  childName: string | null;
  memberContact: string;
  memberSinceLabel: string;
  cancelRemaining: number;
  pkg: {
    id: string;
    name: string;
    sisaSesi: number;
    totalSesi: number;
    jatahCancel: number;
    status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
    expiredDate: Date | null;
    expiredDateInput: string;
  };
};

export default function PaketPerMemberList({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter((r) => {
        const q = search.trim().toLowerCase();
        return r.memberName.toLowerCase().includes(q) || (r.childName ?? "").toLowerCase().includes(q);
      })
    : rows;

  return (
    <>
      <Input
        type="search"
        placeholder="Cari nama ortu atau anak..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle">Gak ada yang cocok sama pencarian &ldquo;{search}&rdquo;.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <PackageMemberCard
                memberName={r.memberName}
                childName={r.childName}
                memberContact={r.memberContact}
                memberSinceLabel={r.memberSinceLabel}
                cancelRemaining={r.cancelRemaining}
                pkg={r.pkg}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

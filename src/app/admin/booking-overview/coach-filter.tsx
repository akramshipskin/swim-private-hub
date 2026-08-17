"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export default function CoachFilter({
  coaches,
  selected,
}: {
  coaches: { id: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selected}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v === "all" ? "/admin/booking-overview" : `/admin/booking-overview?coach=${v}`);
      }}
      className="w-full sm:w-56"
    >
      <option value="all">Semua Coach</option>
      {coaches.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}

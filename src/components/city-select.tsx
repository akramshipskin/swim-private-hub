import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/input";
import { CITIES } from "@/lib/cities";

// Pilihan kota layanan SPH (Hadi 3 Okt). Dicek ulang di server (isCity).
export function CitySelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select name="city" required {...props}>
      <option value="">Pilih kota</option>
      {CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </Select>
  );
}

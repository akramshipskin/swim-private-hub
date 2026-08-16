"use client";

import { useState } from "react";
import { Select, Label } from "@/components/ui/input";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

// Native <input type="time"> ikut format jam locale browser (bisa AM/PM),
// dan step-nya default per menit -- susah buat dipaksa 24h + kelipatan 30
// menit lintas browser. Dropdown custom ini guarantee dua-duanya.
export function TimeSelect({
  name,
  label,
  defaultValue = "08:00",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [h, m] = defaultValue.split(":");
  const [hour, setHour] = useState(h ?? "08");
  const [minute, setMinute] = useState(MINUTES.includes(m) ? m : "00");

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <Select
          aria-label={`${label} - jam`}
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="w-[4.5rem]"
        >
          {HOURS.map((hh) => (
            <option key={hh} value={hh}>
              {hh}
            </option>
          ))}
        </Select>
        <span className="text-text-muted">:</span>
        <Select
          aria-label={`${label} - menit`}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="w-[4.5rem]"
        >
          {MINUTES.map((mm) => (
            <option key={mm} value={mm}>
              {mm}
            </option>
          ))}
        </Select>
      </div>
      <input type="hidden" name={name} value={`${hour}:${minute}`} />
    </div>
  );
}

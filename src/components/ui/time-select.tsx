"use client";

import { useState } from "react";
import { Select, Label } from "@/components/ui/input";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

// Native <input type="time"> ikut format jam locale browser (bisa AM/PM),
// dan step-nya default per menit -- susah buat dipaksa 24h + kelipatan 30
// menit lintas browser. Dropdown custom ini guarantee dua-duanya.
//
// hourOnly: coach jadwal cuma butuh presisi per jam (slot selalu dipecah
// per jam genap) -- skip pilihan menit sepenuhnya biar 1 baris lebih
// ringkes, menit dikunci "00".
export function TimeSelect({
  name,
  label,
  defaultValue = "08:00",
  hourOnly = false,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hourOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  const [h, m] = defaultValue.split(":");
  const [hour, setHour] = useState(h ?? "08");
  const [minute, setMinute] = useState(MINUTES.includes(m) ? m : "00");

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <Select
          aria-label={hourOnly ? label : `${label} - jam`}
          value={hour}
          onChange={(e) => {
            setHour(e.target.value);
            onChange?.(`${e.target.value}:${hourOnly ? "00" : minute}`);
          }}
          className="w-[4.5rem]"
        >
          {HOURS.map((hh) => (
            <option key={hh} value={hh}>
              {hh}
            </option>
          ))}
        </Select>
        {!hourOnly && (
          <>
            <span className="text-text-muted">:</span>
            <Select
              aria-label={`${label} - menit`}
              value={minute}
              onChange={(e) => {
                setMinute(e.target.value);
                onChange?.(`${hour}:${e.target.value}`);
              }}
              className="w-[4.5rem]"
            >
              {MINUTES.map((mm) => (
                <option key={mm} value={mm}>
                  {mm}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
      <input type="hidden" name={name} value={`${hour}:${hourOnly ? "00" : minute}`} />
    </div>
  );
}

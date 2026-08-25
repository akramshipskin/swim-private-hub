"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "system", label: "Sistem" },
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
];

function applyMode(mode: Mode) {
  if (mode === "system") {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem("theme");
  } else {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem("theme", mode);
  }
}

// Segmented 3-opsi (bukan cuma 2 toggle) -- "Sistem" ngikut
// prefers-color-scheme OS secara live, "Terang"/"Gelap" ngunci manual
// lewat localStorage. Baca state awal dari localStorage di useEffect
// (bukan pas render pertama) biar gak mismatch sama SSR.
export function ThemeMenu() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setMode(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setMode(opt.value);
            applyMode(opt.value);
          }}
          className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === opt.value
              ? "bg-brand-600 text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

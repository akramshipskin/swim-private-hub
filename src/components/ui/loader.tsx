"use client";

import { ThinkingOrb } from "thinking-orbs";

// Satu-satunya indikator loading di app ini (Hadi 18 Sep): orb dari
// thinking-orbs, state "composing" (Hadi 24 Sep, sebelumnya "working"). Ukurannya cuma dua yang di-tuning upstream:
// 64 (blok besar, mis. halaman penuh) dan 20 (inline, mis. di dalam tombol).
// Tema (terang/gelap) dideteksi sendiri oleh komponennya dari data-theme.
export function Loader({ size = 64, label = "Memuat" }: { size?: 64 | 20; label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <ThinkingOrb state="composing" size={size} aria-label={label} />
    </span>
  );
}

// Rasio kontras WCAG 2.x, dihitung dari kode warna asli -- dipakai di
// /brandguideline supaya angka di tabel kontras selalu cocok dengan token
// warna sungguhan (src/app/globals.css), bukan angka yang diketik manual dan
// bisa basi kalau tokennya berubah.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Rasio kontras antara dua warna, urutan argumen tidak penting (1:1 s/d 21:1).
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA-large" | "fail";

// Batas WCAG untuk teks biasa: AAA >= 7:1, AA >= 4.5:1, UI/teks besar >= 3:1.
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large";
  return "fail";
}

export const WCAG_LEVEL_LABEL: Record<WcagLevel, string> = {
  AAA: "AAA",
  AA: "AA",
  "AA-large": "UI/teks besar saja",
  fail: "Gagal",
};

// Kode error login terkunci dari server: "locked_742" = boleh coba lagi 742
// detik lagi (lihat LockedError di src/lib/authorize.ts). "locked" tanpa angka =
// kode lama, tanpa hitung mundur.
export function lockSecondsFromCode(code: string | undefined): number | null {
  const m = /^locked_(\d+)$/.exec(code ?? "");
  return m ? Number(m[1]) : null;
}

export const isLockedCode = (code: string | undefined) => code === "locked" || lockSecondsFromCode(code) !== null;

// 742 -> "12:22"
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

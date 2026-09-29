// Milestone perkembangan peserta (keputusan Hadi 29 Sep). Semua aturan level
// & kelompok umur ada di sini sebagai fungsi murni supaya bisa dites tanpa DB.
// Daftar butir standar: tabel MilestoneItem (diisi migrasi milestone).
import { ageFromBirthDate } from "@/lib/coach-bio";

export type MilestoneGroup = "A" | "B" | "C" | "D";

export const MILESTONE_GROUPS: MilestoneGroup[] = ["A", "B", "C", "D"];

export const MILESTONE_GROUP_LABEL: Record<MilestoneGroup, string> = {
  A: "Bayi & balita (6 bulan – 3 tahun)",
  B: "Anak usia dini (4 – 6 tahun)",
  C: "Anak (7 – 12 tahun)",
  D: "Remaja & dewasa (13 tahun ke atas)",
};

export const MILESTONE_LEVEL_TITLE: Record<string, string> = {
  A1: "Kenal air",
  A2: "Nyaman di air",
  A3: "Siap belajar sendiri",
  B1: "Pengenalan",
  B2: "Mengapung dan meluncur",
  B3: "Bergerak sendiri",
  C1: "Dasar",
  C2: "Gaya bebas dan punggung",
  C3: "Berenang tanpa berhenti",
  C4: "Lanjutan dan keselamatan",
  D1: "Percaya diri di air",
  D2: "Gaya bebas",
  D3: "Daya tahan dan gaya dada",
};

export function levelLabel(group: MilestoneGroup, level: number) {
  const title = MILESTONE_LEVEL_TITLE[`${group}${level}`];
  return `Level ${group}${level}${title ? ` — ${title}` : ""}`;
}

// Kelompok dari umur (tahun penuh). Di bawah 6 bulan tetap A (bersama orang tua).
export function groupForAge(age: number): MilestoneGroup {
  if (age <= 3) return "A";
  if (age <= 6) return "B";
  if (age <= 12) return "C";
  return "D";
}

export function groupForBirthDate(birthDate: Date | null | undefined, now?: Date): MilestoneGroup | null {
  const age = ageFromBirthDate(birthDate, now);
  return age === null ? null : groupForAge(age);
}

export type ItemLite = { id: string; group: MilestoneGroup; level: number; sortOrder: number };
export type AchievementLite = { itemId: string; priorSkill: boolean };
export type CompletionLite = { group: MilestoneGroup; level: number };

// Level-level di satu kelompok, urut naik, masing-masing dengan butirnya.
export function levelsOf<T extends ItemLite>(items: T[], group: MilestoneGroup) {
  const byLevel = new Map<number, T[]>();
  for (const it of items) {
    if (it.group !== group) continue;
    byLevel.set(it.level, [...(byLevel.get(it.level) ?? []), it]);
  }
  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, list]) => ({ level, items: list.sort((x, y) => x.sortOrder - y.sortOrder) }));
}

// Level berjalan = level terendah di kelompok itu yang belum tercatat selesai.
// null = semua level kelompok ini sudah selesai.
export function currentLevel(items: ItemLite[], completions: CompletionLite[], group: MilestoneGroup): number | null {
  const done = new Set(completions.filter((c) => c.group === group).map((c) => c.level));
  return levelsOf(items, group).find((l) => !done.has(l.level))?.level ?? null;
}

// Level yang BARU selesai setelah pencapaian terbaru: semua butirnya tercapai
// tapi belum ada catatan selesai. withCertificate = ada minimal 1 butir yang
// dicapai bersama coach (bukan hasil penilaian awal).
export function newlyCompletedLevels(
  items: ItemLite[],
  achievements: AchievementLite[],
  completions: CompletionLite[],
  group: MilestoneGroup,
) {
  const got = new Map(achievements.map((a) => [a.itemId, a]));
  const done = new Set(completions.filter((c) => c.group === group).map((c) => c.level));
  return levelsOf(items, group)
    .filter((l) => !done.has(l.level) && l.items.length > 0 && l.items.every((it) => got.has(it.id)))
    .map((l) => ({ level: l.level, withCertificate: l.items.some((it) => !got.get(it.id)!.priorSkill) }));
}

// Kelompok berikutnya setelah catatan disimpan. Anak yang naik umur di tengah
// level tetap di kelompok lama sampai level itu selesai (Hadi 29 Sep): pindah
// hanya kalau sedang di batas level (level berjalan belum ada butir tercapai)
// atau seluruh kelompok sudah selesai.
export function nextGroup(
  stored: MilestoneGroup,
  ageGroup: MilestoneGroup | null,
  items: ItemLite[],
  achievements: AchievementLite[],
  completions: CompletionLite[],
): MilestoneGroup {
  // Hanya maju (A -> B -> C -> D); tidak pernah turun kelompok.
  if (!ageGroup || MILESTONE_GROUPS.indexOf(ageGroup) <= MILESTONE_GROUPS.indexOf(stored)) return stored;
  const level = currentLevel(items, completions, stored);
  if (level === null) return ageGroup;
  const got = new Set(achievements.map((a) => a.itemId));
  const started = items.some((it) => it.group === stored && it.level === level && got.has(it.id));
  return started ? stored : ageGroup;
}

// "29 Sep 2026" (WIB) untuk tanggal pencapaian/catatan/sertifikat.
export function formatMilestoneDate(d: Date, month: "short" | "long" = "short") {
  return d.toLocaleDateString("id-ID", { day: "numeric", month, year: "numeric", timeZone: "Asia/Jakarta" });
}

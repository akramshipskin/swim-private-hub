import { describe, expect, it } from "vitest";
import { currentLevel, groupForAge, groupForBirthDate, levelLabel, newlyCompletedLevels, nextGroup, type ItemLite } from "./milestone";

const items: ItemLite[] = [
  { id: "b1a", group: "B", level: 1, sortOrder: 1 },
  { id: "b1b", group: "B", level: 1, sortOrder: 2 },
  { id: "b2a", group: "B", level: 2, sortOrder: 3 },
  { id: "c1a", group: "C", level: 1, sortOrder: 1 },
];

describe("groupForAge", () => {
  it("batas umur A 0-3, B 4-6, C 7-12, D 13+", () => {
    expect([0, 3, 4, 6, 7, 12, 13, 40].map(groupForAge)).toEqual(["A", "A", "B", "B", "C", "C", "D", "D"]);
  });
  it("tanpa tanggal lahir = null", () => {
    expect(groupForBirthDate(null)).toBeNull();
    expect(groupForBirthDate(new Date("2019-05-17"), new Date("2026-09-29T00:00:00Z"))).toBe("C");
  });
});

describe("levelLabel", () => {
  it("memakai judul level standar", () => {
    expect(levelLabel("C", 2)).toBe("Level C2 — Gaya bebas dan punggung");
    expect(levelLabel("C", 9)).toBe("Level C9");
  });
});

describe("currentLevel", () => {
  it("level terendah yang belum selesai; null kalau semua selesai", () => {
    expect(currentLevel(items, [], "B")).toBe(1);
    expect(currentLevel(items, [{ group: "B", level: 1 }], "B")).toBe(2);
    expect(currentLevel(items, [{ group: "B", level: 1 }, { group: "B", level: 2 }], "B")).toBeNull();
  });
});

describe("newlyCompletedLevels", () => {
  it("level selesai kalau semua butirnya tercapai; sertifikat hanya kalau ada butir yang bukan penilaian awal", () => {
    expect(newlyCompletedLevels(items, [{ itemId: "b1a", priorSkill: false }], [], "B")).toEqual([]);
    expect(
      newlyCompletedLevels(items, [{ itemId: "b1a", priorSkill: true }, { itemId: "b1b", priorSkill: false }], [], "B"),
    ).toEqual([{ level: 1, withCertificate: true }]);
    expect(
      newlyCompletedLevels(items, [{ itemId: "b1a", priorSkill: true }, { itemId: "b1b", priorSkill: true }], [], "B"),
    ).toEqual([{ level: 1, withCertificate: false }]);
  });
  it("level yang sudah tercatat selesai tidak dicatat ulang", () => {
    const ach = [{ itemId: "b1a", priorSkill: false }, { itemId: "b1b", priorSkill: false }];
    expect(newlyCompletedLevels(items, ach, [{ group: "B", level: 1 }], "B")).toEqual([]);
  });
});

describe("nextGroup", () => {
  it("naik umur di tengah level: tetap di kelompok lama", () => {
    expect(nextGroup("B", "C", items, [{ itemId: "b1a", priorSkill: false }], [])).toBe("B");
  });
  it("naik umur di batas level (level berjalan belum mulai): pindah kelompok", () => {
    expect(nextGroup("B", "C", items, [{ itemId: "b1a", priorSkill: false }, { itemId: "b1b", priorSkill: false }], [{ group: "B", level: 1 }])).toBe("C");
  });
  it("semua level selesai: pindah ke kelompok umur", () => {
    expect(nextGroup("B", "C", items, [], [{ group: "B", level: 1 }, { group: "B", level: 2 }])).toBe("C");
  });
  it("tidak pernah turun kelompok, dan tetap kalau umur tidak diketahui", () => {
    expect(nextGroup("C", "B", items, [], [])).toBe("C");
    expect(nextGroup("B", null, items, [], [])).toBe("B");
  });
});

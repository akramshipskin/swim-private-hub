import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { overdueFromSessions } = await import("./milestone-hold");

const t = (s: string) => new Date(`2026-10-${s}:00+07:00`);

describe("overdueFromSessions", () => {
  it("1 sesi Hadir tanpa catatan belum ditahan; 2 sesi = ditahan", () => {
    expect(overdueFromSessions([{ dependentId: "d1", startTime: t("02T08:00") }], new Map()).size).toBe(0);
    const two = overdueFromSessions(
      [
        { dependentId: "d1", startTime: t("02T08:00") },
        { dependentId: "d1", startTime: t("05T08:00") },
      ],
      new Map(),
    );
    expect(two.get("d1")).toBe(2);
  });

  it("catatan setelah sesi ke-2 menghapus tunggakan; hanya sesi setelah catatan terakhir yang dihitung", () => {
    const sessions = [
      { dependentId: "d1", startTime: t("02T08:00") },
      { dependentId: "d1", startTime: t("05T08:00") },
      { dependentId: "d1", startTime: t("08T08:00") },
    ];
    expect(overdueFromSessions(sessions, new Map([["d1", t("05T09:30")]])).size).toBe(0);
    expect(overdueFromSessions([...sessions, { dependentId: "d1", startTime: t("10T08:00") }], new Map([["d1", t("05T09:30")]])).get("d1")).toBe(2);
  });

  it("peserta dihitung terpisah", () => {
    const r = overdueFromSessions(
      [
        { dependentId: "d1", startTime: t("02T08:00") },
        { dependentId: "d2", startTime: t("02T09:00") },
        { dependentId: "d2", startTime: t("03T09:00") },
      ],
      new Map(),
    );
    expect([...r.keys()]).toEqual(["d2"]);
  });
});

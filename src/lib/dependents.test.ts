import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { parseParticipantBirthDate } = await import("./dependents");

const NOW = new Date("2026-09-29T05:00:00Z");

describe("parseParticipantBirthDate", () => {
  it("menyimpan tengah malam UTC dari YYYY-MM-DD", () => {
    expect(parseParticipantBirthDate("2019-05-17", NOW).toISOString()).toBe("2019-05-17T00:00:00.000Z");
  });

  it("menolak kosong, format salah, dan tanggal yang tidak ada", () => {
    expect(() => parseParticipantBirthDate("", NOW)).toThrow("Isi tanggal lahir");
    expect(() => parseParticipantBirthDate("17-05-2019", NOW)).toThrow("Isi tanggal lahir");
    expect(() => parseParticipantBirthDate("2019-02-30", NOW)).toThrow("tidak valid");
  });

  it("menolak masa depan dan umur di atas 100 tahun; bayi hari ini boleh", () => {
    expect(() => parseParticipantBirthDate("2026-10-01", NOW)).toThrow("masa depan");
    expect(() => parseParticipantBirthDate("1920-01-01", NOW)).toThrow("tidak masuk akal");
    expect(parseParticipantBirthDate("2026-09-29", NOW)).toBeInstanceOf(Date);
  });
});

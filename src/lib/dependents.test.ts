import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { parseParticipantBirthDate, createDependent, MAX_DEPENDENTS_PER_MEMBER } = await import("./dependents");

import { MAX_NAME } from "./register-input";

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

describe("createDependent: batas jumlah peserta", () => {
  const fakeDb = (count: number) => {
    const create = vi.fn().mockResolvedValue({ id: "d" });
    return { db: { dependent: { count: vi.fn().mockResolvedValue(count), create } } as never, create };
  };

  it("di bawah batas -> dibuat", async () => {
    const { db, create } = fakeDb(MAX_DEPENDENTS_PER_MEMBER - 1);
    await createDependent("m", "ani", db);
    expect(create).toHaveBeenCalledOnce();
  });

  it("sudah mencapai batas -> ditolak, tidak ada yang dibuat", async () => {
    const { db, create } = fakeDb(MAX_DEPENDENTS_PER_MEMBER);
    await expect(createDependent("m", "ani", db)).rejects.toThrow("Maksimal");
    expect(create).not.toHaveBeenCalled();
  });

  it("nama terlalu panjang ditolak, tidak ada yang dibuat; tepat di batas boleh", async () => {
    const { db, create } = fakeDb(0);
    await expect(createDependent("m", "a".repeat(MAX_NAME + 1), db)).rejects.toThrow("Nama maksimal");
    expect(create).not.toHaveBeenCalled();
    await createDependent("m", "a".repeat(MAX_NAME), db);
    expect(create).toHaveBeenCalledOnce();
  });

  it("nama kosong ditolak sebelum cek batas", async () => {
    const { db } = fakeDb(0);
    await expect(createDependent("m", "  ", db)).rejects.toThrow("Nama anak");
  });
});

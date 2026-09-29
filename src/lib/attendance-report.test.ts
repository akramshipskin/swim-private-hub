import { describe, expect, it, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const create = vi.fn();
const updateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: (...a: unknown[]) => findUnique(...a) },
    attendanceReport: { create: (...a: unknown[]) => create(...a), updateMany: (...a: unknown[]) => updateMany(...a) },
  },
}));

const { createAttendanceReport, resolveAttendanceReport } = await import("./attendance-report");

const END = new Date("2026-10-01T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const booking = (o: Record<string, unknown> = {}) => ({
  memberId: "m1",
  status: "BOOKED",
  attended: false,
  availability: { endTime: END },
  ...o,
});
const input = (o: Record<string, unknown> = {}) => ({
  memberId: "m1",
  bookingId: "b1",
  note: "  anak saya datang  ",
  now: new Date(END.getTime() + DAY),
  ...o,
});

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue(booking());
  create.mockResolvedValue({ id: "r1" });
  updateMany.mockResolvedValue({ count: 1 });
});

describe("createAttendanceReport", () => {
  it("membuat laporan untuk sesi Tidak Hadir milik member dalam 3 hari", async () => {
    await createAttendanceReport(input());
    expect(create).toHaveBeenCalledWith({ data: { bookingId: "b1", memberId: "m1", note: "anak saya datang" } });
  });

  it("keterangan kosong disimpan null", async () => {
    await createAttendanceReport(input({ note: "   " }));
    expect(create).toHaveBeenCalledWith({ data: { bookingId: "b1", memberId: "m1", note: null } });
  });

  it("menolak booking milik member lain seolah tidak ada", async () => {
    findUnique.mockResolvedValue(booking({ memberId: "m2" }));
    await expect(createAttendanceReport(input())).rejects.toThrow("tidak ditemukan");
    expect(create).not.toHaveBeenCalled();
  });

  it("menolak sesi yang bukan Tidak Hadir (Hadir / belum ditandai / dibatalkan)", async () => {
    for (const o of [{ attended: true }, { attended: null }, { status: "CANCELLED" }]) {
      findUnique.mockResolvedValue(booking(o));
      await expect(createAttendanceReport(input())).rejects.toThrow("Tidak Hadir");
    }
    expect(create).not.toHaveBeenCalled();
  });

  it("menolak setelah lewat 3 hari sejak sesi selesai, tepat 3 hari masih boleh", async () => {
    await expect(createAttendanceReport(input({ now: new Date(END.getTime() + 3 * DAY + 1) }))).rejects.toThrow("Batas melapor");
    await createAttendanceReport(input({ now: new Date(END.getTime() + 3 * DAY) }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("laporan kedua untuk booking yang sama ditolak dengan pesan jelas", async () => {
    create.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    await expect(createAttendanceReport(input())).rejects.toThrow("sudah dilaporkan");
  });
});

describe("resolveAttendanceReport", () => {
  it("menutup laporan OPEN dengan catatan dan admin", async () => {
    await resolveAttendanceReport({ reportId: "r1", adminId: "a1", resolution: " sudah dicek " });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "r1", status: "OPEN" },
      data: expect.objectContaining({ status: "RESOLVED", resolution: "sudah dicek", resolvedById: "a1" }),
    });
  });

  it("wajib catatan dan tidak menimpa laporan yang sudah ditutup", async () => {
    await expect(resolveAttendanceReport({ reportId: "r1", adminId: "a1", resolution: "" })).rejects.toThrow("minimal");
    updateMany.mockResolvedValue({ count: 0 });
    await expect(resolveAttendanceReport({ reportId: "r1", adminId: "a1", resolution: "oke sip" })).rejects.toThrow("sudah ditutup");
  });
});

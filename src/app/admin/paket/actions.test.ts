import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const poolFindFirst = vi.fn();
const userFindFirst = vi.fn();
const dependentFindUnique = vi.fn();
const packageCreate = vi.fn().mockResolvedValue({});
const packageFindUnique = vi.fn();
const packageUpdate = vi.fn().mockResolvedValue({ count: 1 });
const packageCount = vi.fn().mockResolvedValue(0);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pool: { findFirst: (...args: unknown[]) => poolFindFirst(...args) },
    user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
    dependent: { findUnique: (...args: unknown[]) => dependentFindUnique(...args) },
    package: {
      create: (...args: unknown[]) => packageCreate(...args),
      findUnique: (...args: unknown[]) => packageFindUnique(...args),
      updateMany: (...args: unknown[]) => packageUpdate(...args),
      count: (...args: unknown[]) => packageCount(...args),
    },
  },
}));
// Lock dilewati di unit test; tx = mock prisma yang sama.
vi.mock("@/lib/dedupe-lock", async () => {
  const { prisma } = await import("@/lib/prisma");
  return { withDedupeLock: (_key: string, fn: (tx: unknown) => unknown) => fn(prisma) };
});

const createDependent = vi.fn().mockResolvedValue({});
const createSelfDependent = vi.fn().mockResolvedValue({});
vi.mock("@/lib/dependents", () => ({
  createDependent: (...args: unknown[]) => createDependent(...args),
  createSelfDependent: (...args: unknown[]) => createSelfDependent(...args),
}));

const { addChildForMember, assignPackageToMember, updatePackage } = await import(
  "./actions"
);

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addChildForMember", () => {
  it("requires a memberId", async () => {
    const result = await addChildForMember(null, formData({ type: "child", name: "Budi" }));
    expect(result).toEqual({ error: "Pilih member dulu." });
  });

  it("creates a self dependent when type is self", async () => {
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "self", name: "" }));
    expect(result).toEqual({ success: "Peserta ditambahkan." });
    expect(createSelfDependent).toHaveBeenCalledWith("member-1");
    expect(createDependent).not.toHaveBeenCalled();
  });

  it("creates a named child dependent otherwise", async () => {
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "Budi" }));
    expect(result).toEqual({ success: "Peserta ditambahkan." });
    expect(createDependent).toHaveBeenCalledWith("member-1", "Budi", expect.anything(), null);
  });

  it("menyimpan tanggal lahir bila diisi, menolak yang tidak valid", async () => {
    await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "Budi", birthDate: "2020-05-17" }));
    expect(createDependent).toHaveBeenLastCalledWith("member-1", "Budi", expect.anything(), new Date("2020-05-17T00:00:00Z"));
    createDependent.mockClear();
    const bad = await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "Budi", birthDate: "2999-01-01" }));
    expect(bad).toEqual({ error: "Tanggal lahir tidak boleh di masa depan." });
    expect(createDependent).not.toHaveBeenCalled();
  });

  it("surfaces the underlying error message instead of throwing", async () => {
    createDependent.mockRejectedValueOnce(new Error("Nama anak tidak boleh kosong"));
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "" }));
    expect(result).toEqual({ error: "Nama anak tidak boleh kosong" });
  });
});

describe("assignPackageToMember (model harga-dari-coach, tanpa bagi hasil)", () => {
  const base = { memberId: "member-1", dependentId: "dep-1", poolId: "pool-1", coachId: "coach-1", sesi: "8" };
  const pool = { id: "pool-1", pricePack4: 260_000, pricePack8: 480_000, serviceFeeBps: 650 };
  const coach = { name: "Coach Budi", coachProfile: { isActive: true, pricePack4: 440_000, pricePack8: 800_000 } };
  const ready = () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1", isActive: true });
    poolFindFirst.mockResolvedValueOnce(pool);
    userFindFirst.mockResolvedValueOnce(coach);
  };

  it("requires memberId", async () => {
    const result = await assignPackageToMember(null, formData({ ...base, memberId: "" }));
    expect(result).toEqual({ error: "Pilih member dulu." });
  });

  it("requires dependentId with a specific hint to add a participant first", async () => {
    const result = await assignPackageToMember(null, formData({ ...base, dependentId: "" }));
    expect(result?.error).toContain("Tambah Peserta");
  });

  it("requires pool, coach, and a 4 or 8 session pack", async () => {
    expect(await assignPackageToMember(null, formData({ ...base, coachId: "" }))).toEqual({ error: "Pilih kolam dan coach dulu." });
    expect(await assignPackageToMember(null, formData({ ...base, sesi: "5" }))).toEqual({ error: "Pilih paket 4 atau 8 sesi." });
    expect(packageCreate).not.toHaveBeenCalled();
  });

  // IDOR guard: dependentId dikirim client, HARUS diverifikasi punya
  // memberId yang sama sebelum dipake -- jangan percaya form begitu aja.
  it("rejects when the dependent belongs to a different member (IDOR)", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "someone-else", isActive: true });
    const result = await assignPackageToMember(null, formData(base));
    expect(result).toEqual({ error: "Peserta tidak ditemukan atau bukan milik member ini." });
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("rejects a coach who does not teach at the pool or a pool/coach without prices", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1", isActive: true });
    poolFindFirst.mockResolvedValueOnce(pool);
    userFindFirst.mockResolvedValueOnce(null);
    expect((await assignPackageToMember(null, formData(base)))?.error).toMatch(/tidak mengajar di kolam ini/);
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1", isActive: true });
    poolFindFirst.mockResolvedValueOnce({ ...pool, pricePack8: null });
    userFindFirst.mockResolvedValueOnce(coach);
    expect((await assignPackageToMember(null, formData(base)))?.error).toMatch(/belum dipasang/);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("copies the current pool + coach prices, active now for the pack duration, no payment", async () => {
    ready();
    const before = Date.now();
    const result = await assignPackageToMember(null, formData(base));
    expect(result?.success).toContain("Paket 8 sesi · Coach Budi");
    const data = packageCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({
      memberId: "member-1",
      dependentId: "dep-1",
      poolId: "pool-1",
      coachId: "coach-1",
      totalSesi: 8,
      sisaSesi: 8,
      jatahCancel: 4,
      poolPrice: 480_000,
      coachPrice: 800_000,
      serviceFee: 83_200,
      durationDays: 90,
      status: "ACTIVE",
    });
    expect(data.expiredDate.getTime() - data.startDate.getTime()).toBe(90 * 86_400_000);
    expect(data.startDate.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("refuses a duplicate within 30 seconds (double click)", async () => {
    ready();
    packageCount.mockResolvedValueOnce(1);
    expect(await assignPackageToMember(null, formData(base))).toEqual({ error: "Paket yang sama baru saja diberikan ke peserta ini." });
    expect(packageCreate).not.toHaveBeenCalled();
  });
});

describe("updatePackage", () => {
  it("rejects a negative sisaSesi", async () => {
    const result = await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "-1", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(result?.error).toBeTruthy();
    expect(packageUpdate).not.toHaveBeenCalled();
  });

  // Kolom dikosongkan dulu tersimpan sebagai sisa sesi 0 (Number("") = 0):
  // member kehilangan semua sesinya tanpa admin sadar.
  it("rejects a blank sisaSesi or jatahCancel instead of saving 0", async () => {
    const blankSisa = await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(blankSisa?.error).toBe("Sisa sesi wajib diisi (0 atau lebih).");
    const blankJatah = await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "3", jatahCancel: "", status: "ACTIVE", expiredDate: "" })
    );
    expect(blankJatah?.error).toBe("Jatah batal wajib diisi (0 atau lebih).");
    expect(packageUpdate).not.toHaveBeenCalled();
  });

  it("rejects a negative jatahCancel", async () => {
    const result = await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "1", jatahCancel: "-1", status: "ACTIVE", expiredDate: "" })
    );
    expect(result?.error).toBeTruthy();
  });

  it("returns a not-found error when the package no longer exists", async () => {
    packageFindUnique.mockResolvedValueOnce(null);
    const result = await updatePackage(
      null,
      formData({ packageId: "gone", sisaSesi: "1", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(result).toEqual({ error: "Paket tidak ditemukan, mungkin sudah dihapus." });
  });

  // Clamp: admin gak boleh nge-set sisa sesi ngelewatin total sesi paket
  // itu sendiri (misal salah ketik "80" padahal totalSesi 8).
  it("clamps sisaSesi so it can never exceed the package's own totalSesi", async () => {
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8 });
    await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "80", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(packageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sisaSesi: 8 }) })
    );
  });

  it("leaves sisaSesi untouched when it's already within totalSesi", async () => {
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8 });
    await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(packageUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sisaSesi: 5 }) }));
  });

  // Regression (tes race lokal 2026-09-17): form edit dibuka pas sisa 5,
  // member booking 3x, admin simpan "5" -> 3 sesi gratis. Simpan harus
  // gagal kalau sisa sesi udah beda dari pas form dibuka.
  it("only updates when sisaSesi still equals the value the form was opened with", async () => {
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8 });
    packageUpdate.mockResolvedValueOnce({ count: 0 });
    const result = await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "5", expectedSisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(packageUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "pkg-1", sisaSesi: 5 } }));
    expect(result?.error).toContain("baru saja berubah");
  });

  // Bug sweep 24 Sep: koreksi sisa sesi tanpa ubah tanggal menggeser jam
  // kedaluwarsa ke 23.59.
  it("keeps the exact stored expiry instant when the date in the form is unchanged", async () => {
    const stored = new Date("2026-09-25T07:32:00Z");
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8, expiredDate: stored });
    await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "2026-09-25" })
    );
    expect(packageUpdate.mock.calls[0][0].data.expiredDate).toBe(stored);
  });

  it("sets 23.59.59 WIB of the chosen date when the admin picks a different date", async () => {
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8, expiredDate: new Date("2026-09-25T07:32:00Z") });
    await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "2026-10-02" })
    );
    expect(packageUpdate.mock.calls[0][0].data.expiredDate.toISOString()).toBe("2026-10-02T16:59:59.000Z");
  });

  it("clears the expiry when the admin empties the date field", async () => {
    packageFindUnique.mockResolvedValueOnce({ totalSesi: 8, expiredDate: new Date("2026-09-25T07:32:00Z") });
    await updatePackage(
      null,
      formData({ packageId: "pkg-1", sisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "" })
    );
    expect(packageUpdate.mock.calls[0][0].data.expiredDate).toBeNull();
  });
});

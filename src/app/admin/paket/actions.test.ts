import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const templateCreate = vi.fn().mockResolvedValue({});
const templateUpdate = vi.fn().mockResolvedValue({});
const templateFindUnique = vi.fn();
const dependentFindUnique = vi.fn();
const packageCreate = vi.fn().mockResolvedValue({});
const packageFindUnique = vi.fn();
const packageUpdate = vi.fn().mockResolvedValue({ count: 1 });
const templateCount = vi.fn().mockResolvedValue(0);
const packageCount = vi.fn().mockResolvedValue(0);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    packageTemplate: {
      create: (...args: unknown[]) => templateCreate(...args),
      update: (...args: unknown[]) => templateUpdate(...args),
      findUnique: (...args: unknown[]) => templateFindUnique(...args),
      count: (...args: unknown[]) => templateCount(...args),
    },
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

const { createTemplate, updateTemplate, addChildForMember, assignPackageToMember, updatePackage } = await import(
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

describe("createTemplate duplicate name", () => {
  it("refuses a second template with the same name in the same pool", async () => {
    templateCount.mockResolvedValueOnce(1);
    const fd = new FormData();
    for (const [k, v] of Object.entries({ poolId: "p1", name: "Paket A", totalSesi: "8", price: "100", durationDays: "60", jatahCancel: "2" })) fd.set(k, v);
    const res = await createTemplate(null, fd);
    expect(res?.error).toMatch(/sudah ada/);
    expect(templateCreate).not.toHaveBeenCalled();
  });
});

describe("createTemplate", () => {
  const valid = { poolId: "pool-1", name: "Private 8x", totalSesi: "8", price: "750000", durationDays: "60", jatahCancel: "2" };

  it("creates when all fields are valid", async () => {
    const result = await createTemplate(null, formData(valid));
    expect(result).toBeNull();
    expect(templateCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ poolId: "pool-1", name: "Private 8x", totalSesi: 8, price: 750000, durationDays: 60, jatahCancel: 2, isActive: true }),
    });
  });

  it("rejects totalSesi below 1", async () => {
    const result = await createTemplate(null, formData({ ...valid, totalSesi: "0" }));
    expect(result?.error).toBeTruthy();
    expect(templateCreate).not.toHaveBeenCalled();
  });

  it("rejects a negative price", async () => {
    const result = await createTemplate(null, formData({ ...valid, price: "-1" }));
    expect(result?.error).toBeTruthy();
    expect(templateCreate).not.toHaveBeenCalled();
  });

  it("rejects durationDays below 1", async () => {
    const result = await createTemplate(null, formData({ ...valid, durationDays: "0" }));
    expect(result?.error).toBeTruthy();
    expect(templateCreate).not.toHaveBeenCalled();
  });

  it("rejects a negative jatahCancel", async () => {
    const result = await createTemplate(null, formData({ ...valid, jatahCancel: "-1" }));
    expect(result?.error).toBeTruthy();
    expect(templateCreate).not.toHaveBeenCalled();
  });

  it("rejects a blank name", async () => {
    const result = await createTemplate(null, formData({ ...valid, name: "   " }));
    expect(result?.error).toBeTruthy();
    expect(templateCreate).not.toHaveBeenCalled();
  });
});

describe("updateTemplate", () => {
  it("updates including the isActive checkbox state", async () => {
    const fd = formData({
      templateId: "tpl-1",
      name: "Private 8x",
      totalSesi: "8",
      price: "750000",
      durationDays: "60",
      jatahCancel: "2",
    });
    fd.set("isActive", "on");
    const result = await updateTemplate(null, fd);
    expect(result).toBeNull();
    expect(templateUpdate).toHaveBeenCalledWith({
      where: { id: "tpl-1" },
      data: expect.objectContaining({ name: "Private 8x", totalSesi: 8, price: 750000, durationDays: 60, jatahCancel: 2, isActive: true }),
    });
  });

  it("treats a missing isActive field as false (unchecked checkbox)", async () => {
    const fd = formData({ templateId: "tpl-1", name: "X", totalSesi: "1", price: "0", durationDays: "1", jatahCancel: "0" });
    await updateTemplate(null, fd);
    expect(templateUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
  });
});

describe("addChildForMember", () => {
  it("requires a memberId", async () => {
    const result = await addChildForMember(null, formData({ type: "child", name: "Budi" }));
    expect(result).toEqual({ error: "Pilih member dulu" });
  });

  it("creates a self dependent when type is self", async () => {
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "self", name: "" }));
    expect(result).toBeNull();
    expect(createSelfDependent).toHaveBeenCalledWith("member-1");
    expect(createDependent).not.toHaveBeenCalled();
  });

  it("creates a named child dependent otherwise", async () => {
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "Budi" }));
    expect(result).toBeNull();
    expect(createDependent).toHaveBeenCalledWith("member-1", "Budi");
  });

  it("surfaces the underlying error message instead of throwing", async () => {
    createDependent.mockRejectedValueOnce(new Error("Nama anak tidak boleh kosong"));
    const result = await addChildForMember(null, formData({ memberId: "member-1", type: "child", name: "" }));
    expect(result).toEqual({ error: "Nama anak tidak boleh kosong" });
  });
});

describe("assignPackageToMember", () => {
  const base = {
    memberId: "member-1",
    dependentId: "dep-1",
    name: "Private 8x",
    totalSesi: "8",
    jatahCancel: "2",
    expiredDate: "",
  };

  it("requires memberId", async () => {
    const result = await assignPackageToMember(null, formData({ ...base, memberId: "" }));
    expect(result).toEqual({ error: "Pilih member dulu" });
  });

  it("requires dependentId with a specific hint to add a participant first", async () => {
    const result = await assignPackageToMember(null, formData({ ...base, dependentId: "" }));
    expect(result?.error).toContain("Tambah Peserta");
  });

  // IDOR guard: dependentId dikirim client, HARUS diverifikasi punya
  // memberId yang sama sebelum dipake -- jangan percaya form begitu aja.
  it("rejects when the dependent belongs to a different member (IDOR)", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "someone-else" });
    const result = await assignPackageToMember(null, formData({ ...base, poolId: "pool-1" }));
    expect(result).toEqual({ error: "Anak tidak ditemukan atau bukan punya member ini" });
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("takes poolId from the template when templateId is set, ignoring a mismatched form poolId", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1" });
    templateFindUnique.mockResolvedValueOnce({ poolId: "pool-from-template" });
    const result = await assignPackageToMember(
      null,
      formData({ ...base, templateId: "tpl-1", poolId: "pool-from-form" })
    );
    expect(result).toBeNull();
    expect(packageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poolId: "pool-from-template" }) })
    );
  });

  it("requires an explicit poolId when not assigning from a catalog template", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1" });
    const result = await assignPackageToMember(null, formData({ ...base, poolId: "" }));
    expect(result).toEqual({ error: "Kolam wajib dipilih (kalau bukan dari katalog paket)" });
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("sets sisaSesi equal to totalSesi for a brand-new package", async () => {
    dependentFindUnique.mockResolvedValueOnce({ memberId: "member-1" });
    await assignPackageToMember(null, formData({ ...base, poolId: "pool-1" }));
    expect(packageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalSesi: 8, sisaSesi: 8 }) })
    );
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
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));

const userFindFirst = vi.fn();
const userCreate = vi.fn();
const dependentCreateMany = vi.fn().mockResolvedValue({});
const packageTemplateFindMany = vi.fn().mockResolvedValue([]);
const packageCreate = vi.fn().mockResolvedValue({});
const userUpdate = vi.fn().mockResolvedValue({});
const userUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const poolCreate = vi.fn().mockResolvedValue({ id: "pool-new" });
const ownershipCreate = vi.fn().mockResolvedValue({});
const poolCount = vi.fn().mockResolvedValue(1);

function makeTx() {
  return {
    user: { create: (...args: unknown[]) => userCreate(...args) },
    dependent: { createMany: (...args: unknown[]) => dependentCreateMany(...args) },
    package: { create: (...args: unknown[]) => packageCreate(...args) },
    pool: { create: (...args: unknown[]) => poolCreate(...args) },
    poolOwnership: { create: (...args: unknown[]) => ownershipCreate(...args) },
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => fn(makeTx()),
    user: {
      findFirst: (...args: unknown[]) => userFindFirst(...args),
      update: (...args: unknown[]) => userUpdate(...args),
      updateMany: (...args: unknown[]) => userUpdateMany(...args),
    },
    packageTemplate: { findMany: (...args: unknown[]) => packageTemplateFindMany(...args) },
    pool: { count: (...args: unknown[]) => poolCount(...args) },
  },
}));

const createSelfDependent = vi.fn().mockResolvedValue({ id: "dep-self" });
const createDependent = vi.fn().mockResolvedValue({ id: "dep-child", name: "Budi" });
vi.mock("@/lib/dependents", () => ({
  createSelfDependent: (...args: unknown[]) => createSelfDependent(...args),
  createDependent: (...args: unknown[]) => createDependent(...args),
}));

const { createUser, importMembersXlsx, toggleUserActive, resetUserPassword } = await import("./actions");

function formData(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    for (const val of Array.isArray(v) ? v : [v]) fd.append(k, val);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindFirst.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "user-1" });
  packageTemplateFindMany.mockResolvedValue([]);
});

describe("createUser", () => {
  const base = { name: "budi santoso", phone: "081200000001", email: "", password: "password123", role: "COACH" };

  it("rejects a password shorter than 8 characters", async () => {
    const result = await createUser(null, formData({ ...base, password: "short" }));
    expect(result?.error).toBeTruthy();
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("rejects when phone or email is already registered", async () => {
    userFindFirst.mockResolvedValue({ id: "existing" });
    const result = await createUser(null, formData(base));
    expect(result).toEqual({ error: "No HP atau email sudah terdaftar" });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("title-cases the name before saving", async () => {
    await createUser(null, formData(base));
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Budi Santoso" }) })
    );
  });

  it("requires at least one participant (self or child) when creating a MEMBER", async () => {
    const result = await createUser(null, formData({ ...base, role: "MEMBER" }));
    expect(result).toEqual({ error: "Pilih minimal 1 peserta (diri sendiri atau anak)" });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("creates a MEMBER with mustChangePassword forced true, given a participant", async () => {
    await createUser(null, formData({ ...base, role: "MEMBER", participantType: "self", participantName: "" }));
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "MEMBER", mustChangePassword: true }) })
    );
  });

  it("does not force mustChangePassword for non-MEMBER roles", async () => {
    await createUser(null, formData(base));
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ mustChangePassword: true }) })
    );
  });

  it("attaches an empty coachProfile when creating a COACH", async () => {
    await createUser(null, formData(base));
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ coachProfile: { create: {} } }) })
    );
  });

  it("creates named child dependents from repeated participant fields", async () => {
    await createUser(
      null,
      formData({
        ...base,
        role: "MEMBER",
        participantType: ["child", "child"],
        participantName: ["budi jr", "wati"],
      })
    );
    expect(dependentCreateMany).toHaveBeenCalledWith({
      data: [
        { memberId: "user-1", name: "Budi Jr" },
        { memberId: "user-1", name: "Wati" },
      ],
    });
  });
});

describe("toggleUserActive", () => {
  // Regression (sweep 2026-09-17): admin bisa nonaktifin akunnya sendiri ->
  // ke-logout permanen, gak ada admin lain buat ngaktifin balik.
  it("refuses to deactivate the admin's own account", async () => {
    await toggleUserActive("admin-1", false);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("updates isActive to the given value", async () => {
    await toggleUserActive("user-1", false);
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { isActive: false }, select: { role: true } });
  });
});

describe("createUser POOL_OWNER", () => {
  const base = { name: "sari", phone: "081200000099", password: "rahasia123", role: "POOL_OWNER" };

  it("creates a new pool and links the owner to it", async () => {
    userCreate.mockResolvedValueOnce({ id: "owner-1" });
    const res = await createUser(null, formData({ ...base, poolMode: "new", newPoolName: "Kolam Baru", newPoolAddress: "Jl. A" }));
    expect(res).toBeNull();
    expect(poolCreate).toHaveBeenCalledWith({ data: { name: "Kolam Baru", address: "Jl. A", isActive: true } });
    expect(ownershipCreate).toHaveBeenCalledWith({ data: { poolId: "pool-new", ownerId: "owner-1" } });
  });

  it("links to an existing pool", async () => {
    userCreate.mockResolvedValueOnce({ id: "owner-2" });
    await createUser(null, formData({ ...base, poolMode: "existing", poolId: "pool-1" }));
    expect(poolCreate).not.toHaveBeenCalled();
    expect(ownershipCreate).toHaveBeenCalledWith({ data: { poolId: "pool-1", ownerId: "owner-2" } });
  });

  it("requires a pool", async () => {
    const res = await createUser(null, formData({ ...base, poolMode: "new" }));
    expect(res?.error).toMatch(/kolam/);
    expect(userCreate).not.toHaveBeenCalled();
  });
});

describe("resetUserPassword", () => {
  it("refuses to reset the admin's own password", async () => {
    const res = await resetUserPassword("admin-1");
    expect(res.error).toBeTruthy();
    expect(userUpdateMany).not.toHaveBeenCalled();
  });

  it("sets a new hash, forces a password change, and returns a readable temp password", async () => {
    userUpdateMany.mockResolvedValueOnce({ count: 1 });
    const res = await resetUserPassword("user-1");
    expect(res.tempPassword).toMatch(/^[a-hjkmnp-z2-9]{10}$/);
    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "hashed", mustChangePassword: true, sessionVersion: { increment: 1 } },
    });
  });

  it("reports a missing user", async () => {
    userUpdateMany.mockResolvedValueOnce({ count: 0 });
    const res = await resetUserPassword("gone");
    expect(res).toEqual({ error: "User tidak ditemukan." });
  });
});

function xlsxFile(rows: Record<string, string | number>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new File([new Uint8Array(buf)], "members.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function importFormData(rows: Record<string, string | number>[], poolId = "pool-1") {
  const fd = new FormData();
  fd.set("poolId", poolId);
  fd.set("file", xlsxFile(rows));
  return fd;
}

describe("importMembersXlsx", () => {
  it("requires a destination pool", async () => {
    const fd = new FormData();
    fd.set("file", xlsxFile([{ "Nama Member": "Budi", "No HP": "081200000001" }]));
    const result = await importMembersXlsx(null, fd);
    expect(result?.error).toBeTruthy();
  });

  it("requires a file", async () => {
    const fd = new FormData();
    fd.set("poolId", "pool-1");
    const result = await importMembersXlsx(null, fd);
    expect(result?.error).toBeTruthy();
  });

  it("imports one member with one participant and one package from flexible Indonesian headers", async () => {
    const result = await importMembersXlsx(
      null,
      importFormData([
        {
          "Nama Member": "budi santoso",
          "No HP": "081200000001",
          "Nama Peserta/Anak": "Budi Jr",
          "Paket Aktif": "Private 8x",
          "Sisa Sesi": 5,
        },
      ])
    );
    expect(result?.result).toContain("1 member, 1 peserta, 1 paket berhasil diimport");
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Budi Santoso", phone: "081200000001", mustChangePassword: true }) })
    );
    expect(packageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sisaSesi: 5, totalSesi: 5 }) })
    );
  });

  it("groups multiple rows with the same phone number into one member with multiple participants", async () => {
    const result = await importMembersXlsx(
      null,
      importFormData([
        { "Nama Member": "Dedi", "No HP": "081200000002", "Nama Peserta/Anak": "Anak Satu" },
        { "Nama Member": "Dedi", "No HP": "081200000002", "Nama Peserta/Anak": "Anak Dua" },
      ])
    );
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(dependentCreateMany).not.toHaveBeenCalled(); // pakai createDependent per baris, bukan createMany
    expect(createDependent).toHaveBeenCalledTimes(2);
    expect(result?.result).toContain("1 member, 2 peserta");
  });

  it("clamps sisaSesi to the catalog template's totalSesi when the sheet says more than the template allows", async () => {
    packageTemplateFindMany.mockResolvedValue([{ id: "tpl-1", name: "Private 8x", totalSesi: 8, jatahCancel: 2, durationDays: 60 }]);
    await importMembersXlsx(
      null,
      importFormData([
        { "Nama Member": "Budi", "No HP": "081200000003", "Nama Peserta/Anak": "Budi Jr", "Paket": "Private 8x", "Sisa Sesi": 20 },
      ])
    );
    expect(packageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalSesi: 8, sisaSesi: 8, templateId: "tpl-1" }) })
    );
  });

  // Temuan sweep keamanan 25 Sep: dulu semua member import dapat password sama
  // ("renang2026") -- siapa pun yang tahu No HP member baru bisa masuk.
  it("gives every imported member a different random temporary password, shown once to the admin", async () => {
    const result = await importMembersXlsx(
      null,
      importFormData([
        { "Nama Member": "Ani", "No HP": "+62 812-0000-0011" },
        { "Nama Member": "Beni", "No HP": "081200000012" },
      ])
    );
    const creds = result?.credentials ?? [];
    expect(creds.map((c) => c.phone)).toEqual(["081200000011", "081200000012"]);
    expect(creds[0].password).toMatch(/^[a-z2-9]{10}$/);
    expect(creds[0].password).not.toBe(creds[1].password);
    expect(result?.result).not.toContain("renang2026");
    // Nomor disimpan dalam bentuk baku.
    expect(userCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ phone: "081200000011" }) }));
  });

  it("does not list a member whose import failed among the credentials", async () => {
    userCreate.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));
    const result = await importMembersXlsx(null, importFormData([{ "Nama Member": "Ani", "No HP": "081200000013" }]));
    expect(result?.credentials).toEqual([]);
  });

  // Sweep keamanan 25 Sep: batas ukuran file & jumlah baris import.
  it("refuses a file bigger than 2MB before parsing it", async () => {
    const fd = new FormData();
    fd.set("poolId", "pool-1");
    fd.set("file", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "besar.xlsx"));
    const result = await importMembersXlsx(null, fd);
    expect(result?.error).toContain("2MB");
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("refuses more than 500 rows", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({ "Nama Member": `M${i}`, "No HP": `0812${String(i).padStart(8, "0")}` }));
    const result = await importMembersXlsx(null, importFormData(rows));
    expect(result?.error).toContain("500");
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("skips a row with no phone number instead of failing the whole import", async () => {
    const result = await importMembersXlsx(null, importFormData([{ "Nama Member": "Tanpa HP" }]));
    expect(userCreate).not.toHaveBeenCalled();
    expect(result?.result).toContain("dilewati");
  });

  it("skips a member whose phone/email is already registered", async () => {
    userFindFirst.mockResolvedValue({ id: "existing" });
    const result = await importMembersXlsx(null, importFormData([{ "Nama Member": "Budi", "No HP": "081200000001" }]));
    expect(userCreate).not.toHaveBeenCalled();
    expect(result?.result).toContain("sudah terdaftar");
  });

  it("skips a package with a non-numeric Sisa Sesi but still creates the member and participant", async () => {
    const result = await importMembersXlsx(
      null,
      importFormData([
        { "Nama Member": "Budi", "No HP": "081200000004", "Nama Peserta/Anak": "Budi Jr", "Paket": "Private 8x", "Sisa Sesi": "abc" },
      ])
    );
    expect(userCreate).toHaveBeenCalled();
    expect(packageCreate).not.toHaveBeenCalled();
    expect(result?.result).toContain("Sisa Sesi tidak valid");
  });

  it("creates a bare member with no participant/package when the row has neither", async () => {
    const result = await importMembersXlsx(null, importFormData([{ "Nama Member": "Budi Polos", "No HP": "081200000005" }]));
    expect(userCreate).toHaveBeenCalled();
    expect(createDependent).not.toHaveBeenCalled();
    expect(createSelfDependent).not.toHaveBeenCalled();
    expect(result?.result).toContain("1 member, 0 peserta, 0 paket");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
const notifyWaitlistForCoach = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/coach-pools", () => ({ notifyWaitlistForCoach: (...a: unknown[]) => notifyWaitlistForCoach(...a) }));

const userFindFirst = vi.fn();
const userCreate = vi.fn();
const dependentCreateMany = vi.fn().mockResolvedValue({});
const dependentUpdate = vi.fn().mockResolvedValue({});
const packageCreate = vi.fn().mockResolvedValue({});
const userUpdate = vi.fn().mockResolvedValue({});
const userUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const poolCreate = vi.fn().mockResolvedValue({ id: "pool-new" });
const ownershipCreate = vi.fn().mockResolvedValue({});
const poolCount = vi.fn().mockResolvedValue(1);

function makeTx() {
  return {
    user: { create: (...args: unknown[]) => userCreate(...args) },
    dependent: {
      createMany: (...args: unknown[]) => dependentCreateMany(...args),
      update: (...args: unknown[]) => dependentUpdate(...args),
    },
    package: { create: (...args: unknown[]) => packageCreate(...args) },
    pool: { create: (...args: unknown[]) => poolCreate(...args) },
    poolOwnership: { create: (...args: unknown[]) => ownershipCreate(...args) },
  };
}

const poolUpdateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => fn(makeTx()),
    user: {
      findFirst: (...args: unknown[]) => userFindFirst(...args),
      update: (...args: unknown[]) => userUpdate(...args),
      updateMany: (...args: unknown[]) => userUpdateMany(...args),
    },
    pool: { count: (...args: unknown[]) => poolCount(...args), updateMany: (...args: unknown[]) => poolUpdateMany(...args) },
  },
}));

const createSelfDependent = vi.fn().mockResolvedValue({ id: "dep-self" });
const createDependent = vi.fn().mockResolvedValue({ id: "dep-child", name: "Budi" });
vi.mock("@/lib/dependents", () => ({
  createSelfDependent: (...args: unknown[]) => createSelfDependent(...args),
  createDependent: (...args: unknown[]) => createDependent(...args),
}));

const { createUser, toggleUserActive, resetUserPassword } = await import("./actions");

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
    await createUser(null, formData({ ...base, role: "MEMBER", participantType: "self", participantName: "", participantBirthDate: "1990-05-05" }));
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
        participantBirthDate: ["2018-04-01", "2020-09-15"],
      })
    );
    expect(dependentCreateMany).toHaveBeenCalledWith({
      data: [
        { memberId: "user-1", name: "Budi Jr", birthDate: new Date("2018-04-01T00:00:00Z") },
        { memberId: "user-1", name: "Wati", birthDate: new Date("2020-09-15T00:00:00Z") },
      ],
    });
  });

  it("menyimpan tanggal lahir peserta diri sendiri", async () => {
    await createUser(null, formData({ ...base, role: "MEMBER", participantType: "self", participantName: "", participantBirthDate: "1990-05-05" }));
    expect(dependentUpdate).toHaveBeenCalledWith({ where: { id: "dep-self" }, data: { birthDate: new Date("1990-05-05T00:00:00Z") } });
  });

  it("menolak MEMBER tanpa tanggal lahir peserta (tidak ada akun dibuat)", async () => {
    const result = await createUser(null, formData({ ...base, role: "MEMBER", participantType: "child", participantName: "budi jr" }));
    expect(result?.error).toMatch(/tanggal lahir/i);
    expect(userCreate).not.toHaveBeenCalled();
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

  // Penanda "menunggu persetujuan": Aktifkan pertama kali mengisi approvedAt,
  // tanpa menimpa tanggal persetujuan lama; menonaktifkan tidak menyentuhnya.
  it("records approval on activation only when not approved before", async () => {
    userUpdate.mockResolvedValueOnce({ role: "COACH" });
    await toggleUserActive("user-2", true);
    expect(userUpdateMany).toHaveBeenCalledWith({ where: { id: "user-2", approvedAt: null }, data: { approvedAt: expect.any(Date) } });
  });

  it("persetujuan PERTAMA pemilik kolam ikut menyalakan kolamnya; bukan yang pertama atau bukan pemilik kolam: tidak", async () => {
    userUpdate.mockResolvedValueOnce({ role: "POOL_OWNER" });
    userUpdateMany.mockResolvedValueOnce({ count: 1 });
    await toggleUserActive("owner-1", true);
    expect(poolUpdateMany).toHaveBeenCalledWith({ where: { isActive: false, ownerships: { some: { ownerId: "owner-1" } } }, data: { isActive: true } });

    poolUpdateMany.mockClear();
    userUpdate.mockResolvedValueOnce({ role: "POOL_OWNER" });
    userUpdateMany.mockResolvedValueOnce({ count: 0 });
    await toggleUserActive("owner-1", true);
    userUpdate.mockResolvedValueOnce({ role: "COACH" });
    userUpdateMany.mockResolvedValueOnce({ count: 1 });
    await toggleUserActive("coach-1", true);
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });

  it("does not touch approval when deactivating", async () => {
    userUpdate.mockResolvedValueOnce({ role: "MEMBER" });
    userUpdateMany.mockClear();
    await toggleUserActive("user-3", false);
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});

describe("createUser POOL_OWNER", () => {
  const base = { name: "sari", phone: "081200000099", password: "rahasia123", role: "POOL_OWNER" };

  it("creates a new pool and links the owner to it", async () => {
    userCreate.mockResolvedValueOnce({ id: "owner-1" });
    const res = await createUser(null, formData({ ...base, poolMode: "new", newPoolName: "Kolam Baru", newPoolAddress: "Jl. A" }));
    expect(res).toEqual({ success: expect.stringContaining("dibuat") });
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


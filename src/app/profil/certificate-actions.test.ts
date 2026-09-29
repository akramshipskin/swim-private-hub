import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth(), unstable_update: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dependents", () => ({}));

const uploadObject = vi.fn();
const removeObject = vi.fn();
vi.mock("@/lib/storage", async (orig) => ({
  ...(await orig<typeof import("@/lib/storage")>()),
  isStorageConfigured: () => true,
  uploadObject: (...a: unknown[]) => uploadObject(...a),
  removeObject: (...a: unknown[]) => removeObject(...a),
}));

const profileFindUnique = vi.fn();
const certCount = vi.fn();
const certCreate = vi.fn();
const certFindFirst = vi.fn();
const certDeleteMany = vi.fn();
const tx = {
  $queryRaw: vi.fn(),
  coachCertificate: { count: (...a: unknown[]) => certCount(...a), create: (...a: unknown[]) => certCreate(...a) },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coachProfile: { findUnique: (...a: unknown[]) => profileFindUnique(...a) },
    coachCertificate: {
      findFirst: (...a: unknown[]) => certFindFirst(...a),
      deleteMany: (...a: unknown[]) => certDeleteMany(...a),
    },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  },
}));

const { uploadCoachCertificate, deleteCoachCertificate } = await import("./actions");

const PDF = () => new File([new TextEncoder().encode("%PDF-1.4 isi")], "s.pdf", { type: "application/pdf" });
function fd(name: string, file: File | null = PDF()) {
  const f = new FormData();
  f.append("certificateName", name);
  if (file) f.append("certificate", file);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "coach-1", role: "COACH" } });
  profileFindUnique.mockResolvedValue({ id: "cp-1", _count: { certificates: 2 } });
  certCount.mockResolvedValue(2);
});

describe("uploadCoachCertificate", () => {
  it("menolak akun bukan coach", async () => {
    auth.mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
    expect((await uploadCoachCertificate(null, fd("FASI")))?.error).toBeTruthy();
    expect(uploadObject).not.toHaveBeenCalled();
  });

  it("wajib nama sertifikat", async () => {
    expect(await uploadCoachCertificate(null, fd("   "))).toEqual({ error: "Isi nama sertifikat/lembaga." });
  });

  it("menambah sertifikat baru (PENDING) tanpa menimpa yang lama", async () => {
    const res = await uploadCoachCertificate(null, fd("  Lifeguard  "));
    expect(res).toEqual({ success: true });
    expect(uploadObject).toHaveBeenCalledOnce();
    const path = uploadObject.mock.calls[0][1] as string;
    expect(path).toMatch(/^coach-1\/certificate-\d+\.pdf$/);
    expect(certCreate).toHaveBeenCalledWith({ data: { coachProfileId: "cp-1", name: "Lifeguard", filePath: path } });
  });

  it("menolak sebelum upload kalau sudah 10 sertifikat", async () => {
    profileFindUnique.mockResolvedValue({ id: "cp-1", _count: { certificates: 10 } });
    const res = await uploadCoachCertificate(null, fd("FASI"));
    expect(res?.error).toMatch(/Maksimal 10/);
    expect(uploadObject).not.toHaveBeenCalled();
  });

  it("kalau slot keburu terisi unggahan lain (cek ulang di dalam kunci), file yang baru diunggah dihapus lagi", async () => {
    profileFindUnique.mockResolvedValue({ id: "cp-1", _count: { certificates: 9 } });
    certCount.mockResolvedValue(10);
    const res = await uploadCoachCertificate(null, fd("FASI"));
    expect(res?.error).toMatch(/Maksimal 10/);
    expect(certCreate).not.toHaveBeenCalled();
    expect(removeObject).toHaveBeenCalledWith("coach-certificates", uploadObject.mock.calls[0][1]);
  });

  it("gagal upload file = tidak ada baris baru", async () => {
    uploadObject.mockRejectedValueOnce(new Error("x"));
    expect(await uploadCoachCertificate(null, fd("FASI"))).toEqual({ error: "Upload sertifikat gagal, coba lagi." });
    expect(certCreate).not.toHaveBeenCalled();
  });
});

describe("deleteCoachCertificate", () => {
  it("hanya mencari sertifikat milik coach yang login, lalu menghapus baris + file", async () => {
    certFindFirst.mockResolvedValue({ id: "c1", filePath: "coach-1/certificate-1.pdf" });
    await deleteCoachCertificate("c1");
    expect(certFindFirst).toHaveBeenCalledWith({
      where: { id: "c1", coachProfile: { userId: "coach-1" } },
      select: { id: true, filePath: true },
    });
    expect(certDeleteMany).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(removeObject).toHaveBeenCalledWith("coach-certificates", "coach-1/certificate-1.pdf");
  });

  it("sertifikat milik coach lain / tidak ada = tidak menghapus apa pun", async () => {
    certFindFirst.mockResolvedValue(null);
    await deleteCoachCertificate("c-orang-lain");
    expect(certDeleteMany).not.toHaveBeenCalled();
    expect(removeObject).not.toHaveBeenCalled();
  });

  it("baris lama tanpa file: hapus baris saja", async () => {
    certFindFirst.mockResolvedValue({ id: "legacy_x", filePath: null });
    await deleteCoachCertificate("legacy_x");
    expect(certDeleteMany).toHaveBeenCalled();
    expect(removeObject).not.toHaveBeenCalled();
  });

  it("menolak akun bukan coach", async () => {
    auth.mockResolvedValue({ user: { id: "a", role: "ADMIN" } });
    await deleteCoachCertificate("c1");
    expect(certFindFirst).not.toHaveBeenCalled();
  });
});

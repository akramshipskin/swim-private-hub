import { describe, expect, it, vi, beforeEach } from "vitest";

const requireRole = vi.fn().mockResolvedValue({ user: { id: "admin-1" } });
vi.mock("@/lib/require-role", () => ({ requireRole: (...a: unknown[]) => requireRole(...a) }));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
const aggregate = vi.fn();
const create = vi.fn().mockResolvedValue({});
const updateMany = vi.fn();
const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    testimonial: {
      aggregate: (...a: unknown[]) => aggregate(...a),
      create: (...a: unknown[]) => create(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
    },
  },
}));

const { addTestimonial, updateTestimonial, setTestimonialPublished, deleteTestimonial } = await import("./actions");

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const valid = { name: " Ibu Clara ", role: "Orang tua", quote: "Sangat membantu.", consentNote: "Izin WA 30 Sep" };

beforeEach(() => {
  vi.clearAllMocks();
  aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
  updateMany.mockResolvedValue({ count: 1 });
});

describe("addTestimonial", () => {
  it("menyimpan (dirapikan) dengan urutan terakhir + 1 dan menyegarkan landing", async () => {
    expect(await addTestimonial(null, fd(valid))).toEqual({ success: true });
    expect(create).toHaveBeenCalledWith({ data: { name: "Ibu Clara", role: "Orang tua", quote: "Sangat membantu.", consentNote: "Izin WA 30 Sep", isPublished: false, sortOrder: 5 } });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("urutan pertama = 0 saat tabel masih kosong", async () => {
    aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    await addTestimonial(null, fd(valid));
    expect(create.mock.calls[0][0].data.sortOrder).toBe(0);
  });

  it("menolak tanpa catatan izin, atau kolom wajib kosong (tidak ada yang disimpan)", async () => {
    expect((await addTestimonial(null, fd({ ...valid, consentNote: " " })))?.error).toMatch(/izin/i);
    expect((await addTestimonial(null, fd({ ...valid, quote: "" })))?.error).toMatch(/wajib/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("menolak kutipan terlalu panjang", async () => {
    const res = await addTestimonial(null, fd({ ...valid, quote: "x".repeat(601) }));
    expect(res?.error).toMatch(/kutipan/);
    expect(create).not.toHaveBeenCalled();
  });

  it("hanya admin", async () => {
    requireRole.mockRejectedValueOnce(new Error("REDIRECT:/login"));
    await expect(addTestimonial(null, fd(valid))).rejects.toThrow("REDIRECT");
    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("updateTestimonial / setTestimonialPublished / deleteTestimonial", () => {
  it("update: menyimpan teks dan urutan yang valid; urutan rusak diabaikan", async () => {
    await updateTestimonial("t1", null, fd({ ...valid, sortOrder: "2" }));
    expect(updateMany).toHaveBeenLastCalledWith({ where: { id: "t1" }, data: expect.objectContaining({ name: "Ibu Clara", sortOrder: 2 }) });
    await updateTestimonial("t1", null, fd({ ...valid, sortOrder: "abc" }));
    expect(updateMany.mock.lastCall![0].data).not.toHaveProperty("sortOrder");
  });

  it("update: id tidak ada -> pesan error", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await updateTestimonial("nope", null, fd(valid))).toEqual({ error: "Testimoni tidak ditemukan." });
  });

  it("update: tetap wajib catatan izin", async () => {
    expect((await updateTestimonial("t1", null, fd({ ...valid, consentNote: "" })))?.error).toMatch(/izin/i);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("tampil/sembunyi dan hapus menyegarkan landing", async () => {
    await setTestimonialPublished("t1", false);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "t1" }, data: { isPublished: false } });
    await deleteTestimonial("t1");
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "t1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

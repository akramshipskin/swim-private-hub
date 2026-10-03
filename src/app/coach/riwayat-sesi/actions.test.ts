import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

class RedirectSignal extends Error {}
const redirect = vi.fn<(path: string) => never>(() => {
  throw new RedirectSignal();
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));

const bookingFindUnique = vi.fn();
const bookingUpdateMany = vi.fn();

function makeTx() {
  return {
    booking: { updateMany: (...args: unknown[]) => bookingUpdateMany(...args) },
    // pricesForSessionCoach: tidak ada ganti coach yang selesai.
    coachChangeRequest: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: (...args: unknown[]) => bookingFindUnique(...args) },
    $transaction: (fn: (tx: unknown) => unknown) => fn(makeTx()),
  },
}));

const creditSessionRevenue = vi.fn().mockResolvedValue(undefined);
const reverseSessionRevenue = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/wallet", () => ({
  creditSessionRevenue: (...args: unknown[]) => creditSessionRevenue(...args),
  reverseSessionRevenue: (...args: unknown[]) => reverseSessionRevenue(...args),
}));

const { markAttendance } = await import("./actions");

function formData(bookingId: string, attended: "true" | "false") {
  const fd = new FormData();
  fd.set("bookingId", bookingId);
  fd.set("attended", attended);
  return fd;
}

const PAST = new Date(Date.now() - 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

function baseBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    status: "BOOKED",
    attended: null,
    availability: {
      coachId: "coach-1",
      poolId: "pool-1",
      endTime: PAST,
      coach: { coachProfile: { id: "coachprofile-1" } },
    },
    package: {
      id: "pkg-1",
      totalSesi: 8,
      coachId: "coach-1",
      poolPrice: 480_000,
      coachPrice: 800_000,
      serviceFee: 83_200,
      payments: [{ amount: 1_363_200 }],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  bookingUpdateMany.mockResolvedValue({ count: 1 });
  auth.mockResolvedValue({ user: { id: "coach-1", role: "COACH" } });
});

describe("markAttendance", () => {
  it("redirects to /login when there's no session", async () => {
    auth.mockResolvedValue(null);
    await expect(markAttendance(null, formData("booking-1", "true"))).rejects.toThrow(RedirectSignal);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("refuses a MEMBER (only COACH/ADMIN can mark attendance)", async () => {
    auth.mockResolvedValue({ user: { id: "member-1", role: "MEMBER" } });
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Kamu tidak punya akses untuk tindakan ini." });
    expect(bookingFindUnique).not.toHaveBeenCalled();
  });

  it("coach yang belum setuju perjanjian kemitraan ditolak sebelum menyentuh booking atau saldo", async () => {
    auth.mockResolvedValue({ user: { id: "coach-1", role: "COACH", needsPartnerAgreement: true } });
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Setujui perjanjian kemitraan dulu" });
    expect(bookingFindUnique).not.toHaveBeenCalled();
    expect(creditSessionRevenue).not.toHaveBeenCalled();
  });

  it("admin tidak terkena gerbang perjanjian kemitraan", async () => {
    auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN", needsPartnerAgreement: false } });
    bookingFindUnique.mockResolvedValue(null);
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Booking tidak ditemukan atau sudah dibatalkan." });
  });

  it("errors when the booking doesn't exist", async () => {
    bookingFindUnique.mockResolvedValue(null);
    const result = await markAttendance(null, formData("gone", "true"));
    expect(result?.error).toBeTruthy();
  });

  it("errors when the booking was already cancelled", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ status: "CANCELLED" }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result?.error).toContain("dibatalkan");
  });

  it("refuses a coach marking a session that isn't theirs", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ availability: { ...baseBooking().availability, coachId: "someone-else" } }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Sesi ini bukan sesimu." });
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("lets ADMIN mark a session that belongs to a different coach", async () => {
    auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    bookingFindUnique.mockResolvedValue(baseBooking());
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(bookingUpdateMany).toHaveBeenCalled();
  });

  it("refuses to mark attendance before the session has actually ended", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ availability: { ...baseBooking().availability, endTime: FUTURE } }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result?.error).toContain("belum selesai");
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("credits the wallet from the prices stored on the package when newly marked Hadir", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(creditSessionRevenue).toHaveBeenCalledWith(expect.anything(), {
      poolId: "pool-1",
      coachProfileId: "coachprofile-1",
      bookingId: "booking-1",
      attended: true,
      pricing: { paid: 1_363_200, totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000 },
    });
    expect(reverseSessionRevenue).not.toHaveBeenCalled();
  });

  // Model bagi hasil persen lama dihapus (Hadi 2 Okt malam): paket berbayar
  // tanpa harga tersimpan tidak dibagi otomatis, tanda tidak tersimpan.
  it("refuses with a clear message when a paid package has no stored prices (old model)", async () => {
    bookingFindUnique.mockResolvedValue(
      baseBooking({ attended: null, package: { id: "pkg-old", totalSesi: 8, coachId: null, poolPrice: null, coachPrice: null, serviceFee: null, payments: [{ amount: 750_000 }] } })
    );
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Harga sesi ini tidak ditemukan. Hubungi admin." });
    expect(creditSessionRevenue).not.toHaveBeenCalled();
    expect(reverseSessionRevenue).not.toHaveBeenCalled();
  });

  it("Hadir -> Tidak Hadir: balik bagi hasil Hadir, lalu catat bagi hasil tidak datang", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: true }));
    const result = await markAttendance(null, formData("booking-1", "false"));
    expect(result).toBeNull();
    expect(reverseSessionRevenue).toHaveBeenCalledWith(expect.anything(), { bookingId: "booking-1" });
    expect(creditSessionRevenue).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ attended: false }));
    expect(reverseSessionRevenue.mock.invocationCallOrder[0]).toBeLessThan(creditSessionRevenue.mock.invocationCallOrder[0]);
  });

  it("belum ditandai -> Tidak Hadir: catat bagi hasil tidak datang tanpa pembalikan", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null }));
    const result = await markAttendance(null, formData("booking-1", "false"));
    expect(result).toBeNull();
    expect(reverseSessionRevenue).not.toHaveBeenCalled();
    expect(creditSessionRevenue).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ attended: false, pricing: expect.objectContaining({ paid: 1_363_200 }) }));
  });

  it("Tidak Hadir -> Hadir (misal setelah laporan member): balik yang lama, catat pembagian normal", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: false }));
    auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(reverseSessionRevenue).toHaveBeenCalled();
    expect(creditSessionRevenue).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ attended: true }));
  });

  it("coach ditolak kalau sudah lewat 24 jam sejak sesi selesai; tidak ada perubahan", async () => {
    bookingFindUnique.mockResolvedValue(
      baseBooking({ availability: { ...baseBooking().availability, endTime: new Date(Date.now() - 25 * 60 * 60 * 1000) } })
    );
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result?.error).toContain("24 jam");
    expect(bookingUpdateMany).not.toHaveBeenCalled();
    expect(creditSessionRevenue).not.toHaveBeenCalled();
  });

  it("coach masih boleh tepat sebelum batas 24 jam", async () => {
    bookingFindUnique.mockResolvedValue(
      baseBooking({ availability: { ...baseBooking().availability, endTime: new Date(Date.now() - 23 * 60 * 60 * 1000) } })
    );
    expect(await markAttendance(null, formData("booking-1", "true"))).toBeNull();
    expect(creditSessionRevenue).toHaveBeenCalled();
  });

  it("admin tetap boleh menandai walau sudah lewat 24 jam", async () => {
    auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    bookingFindUnique.mockResolvedValue(
      baseBooking({ availability: { ...baseBooking().availability, endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } })
    );
    expect(await markAttendance(null, formData("booking-1", "true"))).toBeNull();
    expect(creditSessionRevenue).toHaveBeenCalled();
  });

  it("does not touch the wallet when re-submitting the same attendance value (no actual change)", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: true }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(creditSessionRevenue).not.toHaveBeenCalled();
    expect(reverseSessionRevenue).not.toHaveBeenCalled();
  });

  // Paket yang di-assign manual/gratis (admin) gak punya Payment SUCCESS --
  // attendance tetep bisa ditandai, tapi TIDAK ada duit beneran buat dibagi.
  it("marks attendance without crediting anything when the package has no successful payment", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null, package: { ...baseBooking().package, payments: [] } }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(bookingUpdateMany).toHaveBeenCalled();
    expect(creditSessionRevenue).not.toHaveBeenCalled();
  });

  // CAS: kalo `attended` udah berubah di antara baca dan updateMany (2
  // klik/tab bersamaan), klaim gagal (count 0) dan HARUS gagal dengan
  // pesan yang jelas -- bukan diem-diem nge-double-credit wallet.
  it("fails with a clear message on a concurrent double-submit instead of double-crediting", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null }));
    bookingUpdateMany.mockResolvedValue({ count: 0 });
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result?.error).toContain("baru saja diubah");
    expect(creditSessionRevenue).not.toHaveBeenCalled();
  });

  it("passes the actor's role (COACH or ADMIN) as attendedBy", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking());
    await markAttendance(null, formData("booking-1", "true"));
    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attendedBy: "COACH" }) })
    );
  });

  // Regression (tes race lokal 2026-09-17): booking dibatalin di antara baca
  // & update masih bisa ditandai Hadir dan wallet kekredit. CAS wajib
  // nyertain status BOOKED.
  it("includes status BOOKED in the conditional update so a just-cancelled booking can't be credited", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null }));
    await markAttendance(null, formData("booking-1", "true"));
    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "booking-1", attended: null, status: "BOOKED" } })
    );
  });
});

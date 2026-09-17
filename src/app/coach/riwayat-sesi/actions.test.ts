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
  return { booking: { updateMany: (...args: unknown[]) => bookingUpdateMany(...args) } };
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
      totalSesi: 8,
      payments: [{ amount: 750_000 }],
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
    expect(result).toEqual({ error: "Gak punya akses." });
    expect(bookingFindUnique).not.toHaveBeenCalled();
  });

  it("errors when the booking doesn't exist", async () => {
    bookingFindUnique.mockResolvedValue(null);
    const result = await markAttendance(null, formData("gone", "true"));
    expect(result?.error).toBeTruthy();
  });

  it("errors when the booking was already cancelled", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ status: "CANCELLED" }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result?.error).toContain("dibatalin");
  });

  it("refuses a coach marking a session that isn't theirs", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ availability: { ...baseBooking().availability, coachId: "someone-else" } }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toEqual({ error: "Bukan sesi kamu." });
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
    expect(result?.error).toContain("Belum waktunya");
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("credits the wallet using perSessionValue = payment amount / totalSesi when newly marked Hadir", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null }));
    const result = await markAttendance(null, formData("booking-1", "true"));
    expect(result).toBeNull();
    expect(creditSessionRevenue).toHaveBeenCalledWith(expect.anything(), {
      poolId: "pool-1",
      coachProfileId: "coachprofile-1",
      bookingId: "booking-1",
      perSessionValue: 93_750, // round(750000 / 8)
    });
    expect(reverseSessionRevenue).not.toHaveBeenCalled();
  });

  it("reverses the wallet credit when toggled from Hadir back to Gak Hadir", async () => {
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: true }));
    const result = await markAttendance(null, formData("booking-1", "false"));
    expect(result).toBeNull();
    expect(reverseSessionRevenue).toHaveBeenCalledWith(expect.anything(), { bookingId: "booking-1" });
    expect(creditSessionRevenue).not.toHaveBeenCalled();
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
    bookingFindUnique.mockResolvedValue(baseBooking({ attended: null, package: { totalSesi: 8, payments: [] } }));
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
    expect(result?.error).toContain("diubah barengan");
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

import { describe, expect, it, vi, beforeEach } from "vitest";

const userFindFirst = vi.fn();
const userCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: (...a: unknown[]) => userFindFirst(...a), create: (...a: unknown[]) => userCreate(...a) } } }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
vi.mock("@/lib/rate-limit", () => ({
  clientIp: () => "1.1.1.1",
  takeAttempt: vi.fn().mockResolvedValue("hit"),
  RATE_LIMIT_REGISTER_ERROR: "x",
  REGISTER_STAFF_PER_IP: 3,
  REGISTER_WINDOW_MS: 1,
}));

const { POST } = await import("./route");

function req(over: Record<string, unknown> = {}) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify({
      name: "coach baru", phone: "081211112222", password: "12345678", acceptedTerms: true,
      specialties: ["Gaya bebas"], birthDate: "1995-06-15", formRenderedAt: Date.now() - 10_000, ...over,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindFirst.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u1", name: "Coach Baru", phone: "081211112222", role: "COACH" });
});

describe("POST /api/register-coach: tanggal lahir", () => {
  it("wajib diisi", async () => {
    const res = await POST(req({ birthDate: undefined }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Tanggal lahir wajib diisi");
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("menolak umur di luar 17-80 tahun dan format rusak", async () => {
    expect((await POST(req({ birthDate: "2015-01-01" }))).status).toBe(400);
    expect((await POST(req({ birthDate: "1900-01-01" }))).status).toBe(400);
    expect((await POST(req({ birthDate: "bukan-tanggal" }))).status).toBe(400);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("menyimpan tanggal lahir (tengah malam WIB) di profil coach", async () => {
    const res = await POST(req());
    expect(res.status).toBe(201);
    const data = userCreate.mock.calls[0][0].data;
    expect(data.coachProfile.create.birthDate).toEqual(new Date("1995-06-15T00:00:00+07:00"));
  });
});

describe("POST /api/register-coach: perjanjian kemitraan (Hadi 2 Okt, 3A)", () => {
  it("belum aktif: tidak mencatat apa pun; aktif: centang yang sama mencatat versi perjanjian coach", async () => {
    const { PARTNER_AGREEMENTS } = await import("@/lib/partner-agreement");
    const original = PARTNER_AGREEMENTS.COACH.version;
    try {
      PARTNER_AGREEMENTS.COACH.version = null;
      await POST(req());
      expect(userCreate.mock.calls[0][0].data.partnerAgreementVersion).toBeUndefined();

      PARTNER_AGREEMENTS.COACH.version = "Perjanjian Coach v1";
      const res = await POST(req());
      expect(res.status).toBe(201);
      expect(userCreate.mock.calls[1][0].data).toMatchObject({ partnerAgreementVersion: "Perjanjian Coach v1", partnerAgreementAcceptedAt: expect.any(Date) });

      userCreate.mockClear();
      const refused = await POST(req({ acceptedTerms: false }));
      expect(refused.status).toBe(400);
      expect((await refused.json()).error).toContain("Perjanjian Kemitraan Coach");
      expect(userCreate).not.toHaveBeenCalled();
    } finally {
      PARTNER_AGREEMENTS.COACH.version = original;
    }
  });
});

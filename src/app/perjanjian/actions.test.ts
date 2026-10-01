import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); } }));
const userUpdate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: (...a: unknown[]) => userUpdate(...a) } } }));

const { acceptPartnerAgreement } = await import("./actions");
const { PARTNER_AGREEMENTS } = await import("@/lib/partner-agreement");
const original = PARTNER_AGREEMENTS.POOL_OWNER.version;

function fd(agree: boolean) {
  const f = new FormData();
  if (agree) f.set("agree", "on");
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  PARTNER_AGREEMENTS.POOL_OWNER.version = "MOU Kolam v1";
});
afterEach(() => {
  PARTNER_AGREEMENTS.POOL_OWNER.version = original;
});

describe("acceptPartnerAgreement", () => {
  it("mencatat waktu & versi untuk akun sendiri lalu ke dashboard", async () => {
    auth.mockResolvedValue({ user: { id: "o1", role: "POOL_OWNER" } });
    await expect(acceptPartnerAgreement(fd(true))).rejects.toThrow("NEXT_REDIRECT:/pool/dashboard");
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { partnerAgreementAcceptedAt: expect.any(Date), partnerAgreementVersion: "MOU Kolam v1" },
    });
  });

  it("tanpa centang ditolak dan tidak menyimpan", async () => {
    auth.mockResolvedValue({ user: { id: "o1", role: "POOL_OWNER" } });
    await expect(acceptPartnerAgreement(fd(false))).rejects.toThrow("NEXT_REDIRECT:/perjanjian?error=1");
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("member, admin, dan tanpa login tidak bisa mencatat", async () => {
    auth.mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
    await expect(acceptPartnerAgreement(fd(true))).rejects.toThrow("NEXT_REDIRECT:/");
    auth.mockResolvedValue(null);
    await expect(acceptPartnerAgreement(fd(true))).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth(), unstable_update: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dependents", () => ({}));

const coachProfileUpdateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { coachProfile: { updateMany: (...a: unknown[]) => coachProfileUpdateMany(...a) } },
}));

const { updateCoachProfile } = await import("./actions");

function fd(entries: [string, string][]) {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "coach-1", role: "COACH" } });
  coachProfileUpdateMany.mockResolvedValue({ count: 1 });
});

describe("updateCoachProfile", () => {
  it("refuses non-coach accounts", async () => {
    auth.mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
    const res = await updateCoachProfile(null, fd([["specialties", "Gaya bebas"]]));
    expect(res?.error).toBeTruthy();
    expect(coachProfileUpdateMany).not.toHaveBeenCalled();
  });

  it("requires at least one known specialty (unknown values are dropped)", async () => {
    const res = await updateCoachProfile(null, fd([["specialties", "Terbang"]]));
    expect(res).toEqual({ error: "Pilih minimal 1 keahlian." });
  });

  it("saves bio and known specialties of the coach's own profile only", async () => {
    const res = await updateCoachProfile(
      null,
      fd([
        ["bio", "  Mengajar 5 tahun  "],
        ["specialties", "Gaya bebas"],
        ["specialties", "Terbang"],
        ["certificationNote", "FASI"],
      ])
    );
    expect(res).toEqual({ success: true });
    expect(coachProfileUpdateMany).toHaveBeenCalledWith({
      where: { userId: "coach-1" },
      data: { bio: "Mengajar 5 tahun", specialties: ["Gaya bebas"] },
    });
  });
});

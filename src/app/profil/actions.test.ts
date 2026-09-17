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
      data: { bio: "Mengajar 5 tahun", specialties: ["Gaya bebas"], birthDate: null, gender: null },
    });
  });

  it("menyimpan tanggal lahir & jenis kelamin, dan menolak umur tidak masuk akal", async () => {
    const ok = await updateCoachProfile(
      null,
      fd([
        ["bio", ""],
        ["specialties", "Gaya bebas"],
        ["birthDate", "1996-04-12"],
        ["gender", "FEMALE"],
      ])
    );
    expect(ok).toEqual({ success: true });
    expect(coachProfileUpdateMany).toHaveBeenCalledWith({
      where: { userId: "coach-1" },
      data: {
        bio: null,
        specialties: ["Gaya bebas"],
        birthDate: new Date("1996-04-12T00:00:00+07:00"),
        gender: "FEMALE",
      },
    });

    const tooYoung = await updateCoachProfile(
      null,
      fd([
        ["specialties", "Gaya bebas"],
        ["birthDate", "2020-01-01"],
      ])
    );
    expect(tooYoung).toEqual({ error: "Tanggal lahir tidak masuk akal (umur 17-80 tahun)." });

    const badGender = await updateCoachProfile(
      null,
      fd([
        ["specialties", "Gaya bebas"],
        ["gender", "LAINNYA"],
      ])
    );
    expect(badGender).toEqual({ error: "Jenis kelamin tidak valid." });
  });
});

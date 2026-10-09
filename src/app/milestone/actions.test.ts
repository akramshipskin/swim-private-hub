import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notifyAdmins: vi.fn(), notifyUser: vi.fn() }));
const transaction = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: (...a: unknown[]) => transaction(...a), dependent: { findUniqueOrThrow: vi.fn() } } }));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/milestone-data", () => ({ coachHasTaughtDependent: vi.fn().mockResolvedValue(true), visibleItemsWhere: vi.fn() }));

const { saveMilestoneUpdate, addMilestoneItem } = await import("./actions");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "coach-1", role: "COACH", needsPartnerAgreement: false } });
});

describe("kontak pribadi di teks coach (Hadi 9 Okt)", () => {
  it("catatan perkembangan dengan nomor HP ditolak sebelum menyentuh database", async () => {
    const res = await saveMilestoneUpdate("d1", null, fd({ note: "Bagus. Hubungi saya di 0812-3456-7890" }));
    expect(res?.error).toMatch(/lewat aplikasi/);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("keterampilan tambahan dengan tautan WhatsApp ditolak", async () => {
    const res = await addMilestoneItem("d1", null, fd({ text: "Latihan privat via wa.me/6281234567890", level: "1" }));
    expect(res?.error).toMatch(/lewat aplikasi/);
  });
});

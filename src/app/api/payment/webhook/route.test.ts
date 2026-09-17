import crypto from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/midtrans", () => ({ platformServerKey: () => "server-key" }));

const paymentFindUnique = vi.fn();
const packageUpdate = vi.fn().mockResolvedValue({});
const tx = {
  payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  package: { update: packageUpdate },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { findUnique: (...a: unknown[]) => paymentFindUnique(...a), update: vi.fn() },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  },
}));

const { POST } = await import("./route");

function settlement() {
  const body = { order_id: "PKG-1", status_code: "200", gross_amount: "135000.00", transaction_status: "settlement" };
  const signature_key = crypto
    .createHash("sha512")
    .update(body.order_id + body.status_code + body.gross_amount + "server-key")
    .digest("hex");
  return new Request("http://x/api/payment/webhook", { method: "POST", body: JSON.stringify({ ...body, signature_key }) });
}

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => vi.clearAllMocks());

describe("webhook package validity", () => {
  it("activates a 1-session package for 14 days, ignoring any template duration", async () => {
    paymentFindUnique.mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
      packageId: "pkg-1",
      package: { isSingleSession: true, template: null },
    });
    await POST(settlement());
    const data = packageUpdate.mock.calls[0][0].data;
    expect(data.status).toBe("ACTIVE");
    expect(Math.round((data.expiredDate - data.startDate) / DAY)).toBe(14);
  });

  it("uses the template duration for a regular package", async () => {
    paymentFindUnique.mockResolvedValue({
      id: "pay-2",
      status: "PENDING",
      packageId: "pkg-2",
      package: { isSingleSession: false, template: { durationDays: 60 } },
    });
    await POST(settlement());
    const data = packageUpdate.mock.calls[0][0].data;
    expect(Math.round((data.expiredDate - data.startDate) / DAY)).toBe(60);
  });
});

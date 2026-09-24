import crypto from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/midtrans", () => ({ platformServerKey: () => "server-key" }));

const sendPushToUser = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/push", () => ({ sendPushToUser: (...a: unknown[]) => sendPushToUser(...a) }));

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
      amount: 135000,
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
      amount: 135000,
      packageId: "pkg-2",
      package: { isSingleSession: false, template: { durationDays: 60 } },
    });
    await POST(settlement());
    const data = packageUpdate.mock.calls[0][0].data;
    expect(Math.round((data.expiredDate - data.startDate) / DAY)).toBe(60);
  });
});

function capture(fraud_status?: string) {
  const body = { order_id: "PKG-1", status_code: "200", gross_amount: "135000.00", transaction_status: "capture", fraud_status };
  const signature_key = crypto
    .createHash("sha512")
    .update(body.order_id + body.status_code + body.gross_amount + "server-key")
    .digest("hex");
  return new Request("http://x/api/payment/webhook", { method: "POST", body: JSON.stringify({ ...body, signature_key }) });
}

describe("webhook fraud_status on card capture", () => {
  beforeEach(() => {
    paymentFindUnique.mockResolvedValue({
      id: "pay-3",
      status: "PENDING",
      amount: 135000,
      packageId: "pkg-3",
      package: { isSingleSession: false, template: { durationDays: 60 } },
    });
  });

  it("activates the package only when fraud_status is accept", async () => {
    await POST(capture("accept"));
    expect(tx.payment.updateMany.mock.calls[0][0].data.status).toBe("SUCCESS");
    expect(packageUpdate.mock.calls[0][0].data.status).toBe("ACTIVE");
  });

  it("holds a challenged capture as PENDING without activating the package", async () => {
    await POST(capture("challenge"));
    expect(tx.payment.updateMany.mock.calls[0][0].data.status).toBe("PENDING");
    expect(packageUpdate).not.toHaveBeenCalled();
  });

  it("holds a capture with no fraud_status instead of activating", async () => {
    await POST(capture(undefined));
    expect(packageUpdate).not.toHaveBeenCalled();
  });

  it("fails a denied capture", async () => {
    await POST(capture("deny"));
    expect(tx.payment.updateMany.mock.calls[0][0].data.status).toBe("FAILED");
    expect(packageUpdate.mock.calls[0][0].data.status).toBe("EXPIRED");
  });
});

describe("webhook signature check", () => {
  it("rejects a tampered signature of the same length and of a different length", async () => {
    for (const signature_key of ["a".repeat(128), "short"]) {
      const body = { order_id: "PKG-1", status_code: "200", gross_amount: "135000.00", transaction_status: "settlement", signature_key };
      const res = await POST(new Request("http://x/api/payment/webhook", { method: "POST", body: JSON.stringify(body) }));
      expect((await res.json()).error).toBe("Signature tidak valid");
    }
    expect(paymentFindUnique).not.toHaveBeenCalled();
  });
});

describe("webhook push notification", () => {
  function pendingPayment(over: Record<string, unknown> = {}) {
    return {
      id: "pay-9",
      status: "PENDING",
      amount: 135000,
      packageId: "pkg-9",
      package: { memberId: "member-9", isSingleSession: false, template: { name: "Private 4x", durationDays: 30 } },
      ...over,
    };
  }

  it("tells the member once when the payment first turns SUCCESS", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment());
    await POST(settlement());
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith(
      "member-9",
      expect.objectContaining({ title: "Pembayaran berhasil", url: "/member/booking" })
    );
    expect(sendPushToUser.mock.calls[0][1].body).toContain("Private 4x");
  });

  it("stays silent for a duplicate notification on an already SUCCESS payment", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment({ status: "SUCCESS" }));
    await POST(settlement());
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("stays silent when a concurrent notification already claimed the payment", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment());
    tx.payment.updateMany.mockResolvedValueOnce({ count: 0 });
    await POST(settlement());
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("stays silent for a challenged capture (still PENDING)", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment());
    await POST(capture("challenge"));
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("still answers ok when sending the push fails", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment());
    sendPushToUser.mockRejectedValueOnce(new Error("push down"));
    const res = await POST(settlement());
    expect((await res.json()).ok).toBe(true);
  });
});

// Sweep keamanan 25 Sep (defense-in-depth): jumlah yang dibayar harus sama
// dengan tagihan kita, walau tanda tangan Midtrans sudah valid.
describe("webhook amount check", () => {
  it("keeps the payment PENDING (package not activated) when the paid amount differs from the bill", async () => {
    paymentFindUnique.mockResolvedValue({
      id: "pay-7",
      status: "PENDING",
      amount: 150000,
      packageId: "pkg-7",
      package: { memberId: "m-7", isSingleSession: false, template: { durationDays: 60 } },
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await POST(settlement());
    expect(tx.payment.updateMany.mock.calls.at(-1)![0].data.status).toBe("PENDING");
    expect(packageUpdate).not.toHaveBeenCalled();
    expect(sendPushToUser).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("records paidAt when the payment turns SUCCESS", async () => {
    paymentFindUnique.mockResolvedValue({
      id: "pay-8",
      status: "PENDING",
      amount: 135000,
      packageId: "pkg-8",
      package: { memberId: "m-8", isSingleSession: false, template: { durationDays: 60 } },
    });
    await POST(settlement());
    const data = tx.payment.updateMany.mock.calls.at(-1)![0].data;
    expect(data.status).toBe("SUCCESS");
    expect(data.paidAt).toBeInstanceOf(Date);
  });
});

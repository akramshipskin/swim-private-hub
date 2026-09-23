import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { disburseViaIris } from "./disbursement";

const args = { amount: 100_000, bankName: "bca", bankAccountNumber: "1", bankAccountName: "A", referenceNo: "w1" };

beforeEach(() => {
  process.env.MIDTRANS_IRIS_SERVER_KEY = "iris-key";
});
afterEach(() => {
  delete process.env.MIDTRANS_IRIS_SERVER_KEY;
  vi.unstubAllGlobals();
});

describe("disburseViaIris outcome classification", () => {
  it("treats a 4xx as a definite rejection (safe to refund)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad account", { status: 400 })));
    expect(await disburseViaIris(args)).toMatchObject({ success: false, definite: true });
  });

  it("treats a 5xx as ambiguous (payout may exist)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 503 })));
    expect(await disburseViaIris(args)).toMatchObject({ success: false, definite: false });
  });

  it("treats a network error as ambiguous", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")));
    expect(await disburseViaIris(args)).toMatchObject({ success: false, definite: false });
  });

  it("treats an unreadable success body as ambiguous", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 200 })));
    expect(await disburseViaIris(args)).toMatchObject({ success: false, definite: false });
  });

  it("returns the reference on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ payouts: [{ reference_no: "ref-9" }] }), { status: 201 }))
    );
    expect(await disburseViaIris(args)).toEqual({ success: true, midtransReferenceId: "ref-9" });
  });
});

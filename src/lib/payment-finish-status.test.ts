import { describe, expect, it } from "vitest";
import { resolveFinishStatus } from "./payment-finish-status";

describe("resolveFinishStatus", () => {
  it("DB SUCCESS menang atas parameter URL apa pun", () => {
    expect(resolveFinishStatus("SUCCESS", "deny")).toBe("success");
    expect(resolveFinishStatus("SUCCESS", undefined)).toBe("success");
  });

  it("DB FAILED/EXPIRED = gagal walau URL bilang settlement (URL bisa dipalsukan)", () => {
    expect(resolveFinishStatus("FAILED", "settlement")).toBe("failed");
    expect(resolveFinishStatus("EXPIRED", "capture")).toBe("failed");
  });

  it("DB PENDING (webhook belum datang) ikut parameter URL", () => {
    expect(resolveFinishStatus("PENDING", "settlement")).toBe("success");
    expect(resolveFinishStatus("PENDING", "pending")).toBe("pending");
    expect(resolveFinishStatus("PENDING", "cancel")).toBe("failed");
    expect(resolveFinishStatus("PENDING", undefined)).toBe("pending");
  });

  it("order tidak ketemu: pakai URL, tanpa URL = unknown (bukan gagal)", () => {
    expect(resolveFinishStatus(null, "capture")).toBe("success");
    expect(resolveFinishStatus(null, "pending")).toBe("pending");
    expect(resolveFinishStatus(null, "expire")).toBe("failed");
    expect(resolveFinishStatus(null, undefined)).toBe("unknown");
  });
});

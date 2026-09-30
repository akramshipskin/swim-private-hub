import { describe, it, expect } from "vitest";
import { shortOrderId } from "./order-id";

describe("shortOrderId", () => {
  it("ambil 8 karakter terakhir dari bagian cuid, huruf besar", () => {
    expect(shortOrderId("PKG-cmujkor0n0001abcd-1789012345678")).toBe("#0001ABCD");
  });
  it("format tak dikenal (tanpa 3 bagian) -> 8 karakter terakhir dari seluruhnya", () => {
    expect(shortOrderId("ORDER12345678")).toBe("#12345678");
    expect(shortOrderId("A-B")).toBe("#A-B");
  });
  it("id pendek tidak dipotong", () => {
    expect(shortOrderId("PKG-abc-1")).toBe("#ABC");
  });
});

import { describe, expect, it } from "vitest";
import { certifiedBadgeText } from "./coach-certificates";

describe("certifiedBadgeText", () => {
  it("null kalau belum ada sertifikat disetujui", () => {
    expect(certifiedBadgeText([])).toBeNull();
    expect(certifiedBadgeText(undefined)).toBeNull();
    expect(certifiedBadgeText(null)).toBeNull();
  });
  it("satu sertifikat: nama saja", () => {
    expect(certifiedBadgeText([{ name: "FASI" }])).toBe("Bersertifikat · FASI");
  });
  it("lebih dari satu: nama pertama + jumlah sisanya", () => {
    expect(certifiedBadgeText([{ name: "FASI" }, { name: "Lifeguard" }, { name: "PRSI" }])).toBe("Bersertifikat · FASI +2");
  });
});

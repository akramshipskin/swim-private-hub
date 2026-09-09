import { describe, expect, it } from "vitest";
import { buildAdminCancelWaLink, buildContactWaLink, buildOwnerInquiryWaLink } from "./whatsapp";

describe("buildContactWaLink", () => {
  it("rewrites a leading 0 to the 62 country code", () => {
    const link = buildContactWaLink("081234567890", "Budi");
    expect(link).toContain("https://wa.me/6281234567890");
  });

  it("leaves an already-62-prefixed number untouched", () => {
    const link = buildContactWaLink("6281234567890", "Budi");
    expect(link).toContain("https://wa.me/6281234567890");
  });
});

describe("buildAdminCancelWaLink", () => {
  const base = {
    memberName: "Test Member",
    coachName: "Coach Rima",
    dateLabel: "Senin, 24 Agustus 2026",
    timeRange: "14.00–15.00",
  };

  it("includes a Buat: line when childName is given", () => {
    const link = buildAdminCancelWaLink({ ...base, childName: "bayu" });
    const message = decodeURIComponent(link.split("?text=")[1]);
    expect(message).toContain("Buat: bayu");
  });

  it("omits the Buat: line for a self-type booking (no childName)", () => {
    const link = buildAdminCancelWaLink(base);
    const message = decodeURIComponent(link.split("?text=")[1]);
    expect(message).not.toContain("Buat:");
  });
});

describe("buildOwnerInquiryWaLink", () => {
  it("points to the admin WhatsApp number", () => {
    const link = buildOwnerInquiryWaLink();
    expect(link).toContain("https://wa.me/6281573400086");
  });
});

import { describe, expect, it } from "vitest";
import { consentData, LEGAL_CONSENT_VERSION } from "./legal";

describe("consentData", () => {
  it("records the time and document version when the box was ticked", () => {
    const c = consentData(true);
    expect(c?.termsVersion).toBe(LEGAL_CONSENT_VERSION);
    expect(c?.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it.each([false, undefined, "true", 1])("refuses anything but literal true (%s)", (v) => {
    expect(consentData(v)).toBeNull();
  });
});

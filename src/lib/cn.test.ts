import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  // Regression: /qa session 2026-08-22 — bare "w-32" passed as an override
  // className lost to the base component's "w-full" because cn() only
  // concatenated strings without deduping conflicting Tailwind utilities.
  // Broke the register page's participant-type Select, which rendered
  // full-width and pushed its sibling "diri sendiri" pill outside the card.
  it("lets a later width class override an earlier conflicting one", () => {
    expect(cn("w-full min-h-[44px]", "w-32 shrink-0")).toBe("min-h-[44px] w-32 shrink-0");
  });

  it("keeps non-conflicting classes from both arguments", () => {
    expect(cn("rounded-xl border border-border", "text-sm text-danger-text")).toBe(
      "rounded-xl border border-border text-sm text-danger-text"
    );
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

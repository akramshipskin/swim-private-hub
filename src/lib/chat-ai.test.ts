import { describe, expect, it } from "vitest";
import { normalizeTurns, buildSystemPrompt, ESCALATE_TOKEN } from "./chat-ai";

describe("normalizeTurns", () => {
  it("drops leading assistant turns and merges consecutive same-role turns", () => {
    expect(
      normalizeTurns([
        { role: "assistant", content: "halo" },
        { role: "user", content: "a" },
        { role: "user", content: "b" },
        { role: "assistant", content: "c" },
      ])
    ).toEqual([
      { role: "user", content: "a\n\nb" },
      { role: "assistant", content: "c" },
    ]);
  });
});

describe("buildSystemPrompt", () => {
  it("includes the business rules and the escalation token", () => {
    const p = buildSystemPrompt("Member", "Rina");
    expect(p).toContain("14 hari");
    expect(p).toContain("20%");
    expect(p).toContain(ESCALATE_TOKEN);
  });
});

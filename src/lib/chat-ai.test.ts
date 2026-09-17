import { describe, expect, it, vi, afterEach } from "vitest";
import { normalizeTurns, buildSystemPrompt, askAi, ESCALATE_TOKEN } from "./chat-ai";

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

describe("askAi provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns null when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await askAi("s", [{ role: "user", content: "hai" }])).toBeNull();
  });

  it("calls Gemini with system instruction and model-role history, returning the text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Halo " }, { text: "kamu" }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const reply = await askAi("aturan", [
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
    ]);
    expect(reply).toBe("Halo kamu");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(":generateContent");
    const body = JSON.parse(init.body);
    expect(body.systemInstruction.parts[0].text).toBe("aturan");
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model"]);
  });

  it("returns null (forward to admin) when Gemini errors", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await askAi("s", [{ role: "user", content: "hai" }])).toBeNull();
  });
});

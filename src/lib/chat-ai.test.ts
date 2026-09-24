import { describe, expect, it, vi, afterEach } from "vitest";
import { normalizeTurns, buildSystemPrompt, askAi, stripEscalateToken, ESCALATE_TOKEN } from "./chat-ai";

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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad" }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await askAi("s", [{ role: "user", content: "hai" }])).toBeNull();
  });
});

describe("stripEscalateToken", () => {
  it("removes the token together with surrounding quotes", () => {
    expect(stripEscalateToken('Saya teruskan ke admin ya. "[ADMIN]"')).toBe("Saya teruskan ke admin ya.");
    expect(stripEscalateToken("Diteruskan ke admin. `[ADMIN]`")).toBe("Diteruskan ke admin.");
    expect(stripEscalateToken("Diteruskan ke admin. [ADMIN]")).toBe("Diteruskan ke admin.");
  });

  it("leaves normal replies untouched", () => {
    expect(stripEscalateToken('Paket berlaku "14 hari".')).toBe('Paket berlaku "14 hari".');
  });
});

describe("chatVisibleSince", () => {
  it("is exactly 90 days before now", async () => {
    const { chatVisibleSince, CHAT_VISIBLE_DAYS } = await import("./chat-ai");
    const now = Date.UTC(2026, 8, 25);
    expect(CHAT_VISIBLE_DAYS).toBe(90);
    expect(chatVisibleSince(now).getTime()).toBe(now - 90 * 86_400_000);
  });
});

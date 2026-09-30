import { describe, it, expect, vi, afterEach } from "vitest";
import { POST, summarizeCspReport } from "./route";

afterEach(() => vi.restoreAllMocks());

const req = (body: string) => new Request("http://x/api/csp-report", { method: "POST", body });

describe("summarizeCspReport", () => {
  it("bentuk report-uri", () => {
    expect(summarizeCspReport({ "csp-report": { "violated-directive": "img-src", "blocked-uri": "https://evil.test/a.png", "document-uri": "http://x/" } })).toBe(
      "directive=img-src blocked=https://evil.test/a.png page=http://x/",
    );
  });
  it("bentuk Reporting API", () => {
    expect(summarizeCspReport([{ type: "csp-violation", body: { effectiveDirective: "script-src", blockedURL: "inline", documentURL: "http://x/p" } }])).toBe(
      "directive=script-src blocked=inline page=http://x/p",
    );
  });
  it("bentuk tak dikenal -> null; nilai panjang dipotong", () => {
    expect(summarizeCspReport(null)).toBeNull();
    expect(summarizeCspReport({ foo: 1 })).toBeNull();
    const long = "a".repeat(500);
    expect(summarizeCspReport({ "csp-report": { "violated-directive": long } })!.length).toBeLessThan(260);
  });
});

describe("POST /api/csp-report", () => {
  it("selalu 204; laporan valid dicatat, sampah tidak", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await POST(req(JSON.stringify({ "csp-report": { "violated-directive": "img-src" } })))).status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect((await POST(req("bukan json"))).status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it("badan terlalu besar diabaikan (tetap 204, tidak dicatat)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const big = JSON.stringify({ "csp-report": { "violated-directive": "x".repeat(9000) } });
    expect((await POST(req(big))).status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });
});

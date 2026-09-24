import { describe, expect, it } from "vitest";
import { hasMatchingSignature } from "./storage";

const file = (bytes: number[], type: string) => new File([new Uint8Array(bytes)], "x", { type });
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("hasMatchingSignature", () => {
  it.each([
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]],
    ["image/png", [0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", [...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")]],
    ["application/pdf", ascii("%PDF-1.7")],
  ])("accepts a real %s", async (type, bytes) => {
    expect(await hasMatchingSignature(file(bytes as number[], type as string))).toBe(true);
  });

  it("rejects an HTML/script file labelled as an image", async () => {
    expect(await hasMatchingSignature(file(ascii("<html><script>"), "image/png"))).toBe(false);
  });

  it("rejects a PNG labelled as PDF, and an unknown type", async () => {
    expect(await hasMatchingSignature(file([0x89, ...ascii("PNG")], "application/pdf"))).toBe(false);
    expect(await hasMatchingSignature(file(ascii("%PDF"), "text/plain"))).toBe(false);
  });
});

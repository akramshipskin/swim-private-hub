import { randomBytes } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSealed, openSecret, sealSecret } from "./secret-box";

const KEY = randomBytes(32).toString("base64");

describe("secret-box", () => {
  beforeEach(() => {
    process.env.SECRET_ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    delete process.env.SECRET_ENCRYPTION_KEY;
  });

  it("round-trips and never stores the plain value", () => {
    const sealed = sealSecret("JBSWY3DPEHPK3PXP");
    expect(isSealed(sealed)).toBe(true);
    expect(sealed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(openSecret(sealed)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("uses a fresh IV each time", () => {
    expect(sealSecret("same")).not.toBe(sealSecret("same"));
  });

  it("passes legacy plain values through unchanged (transition)", () => {
    expect(openSecret("JBSWY3DPEHPK3PXP")).toBe("JBSWY3DPEHPK3PXP");
  });

  it("rejects a tampered value", () => {
    const sealed = sealSecret("JBSWY3DPEHPK3PXP");
    const parts = sealed.split(":");
    parts[4] = Buffer.from("AAAAAAAAAAAAAAAA").toString("base64url");
    expect(() => openSecret(parts.join(":"))).toThrow();
  });

  it("rejects the wrong key", () => {
    const sealed = sealSecret("JBSWY3DPEHPK3PXP");
    process.env.SECRET_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => openSecret(sealed)).toThrow();
  });

  it("refuses to seal without a valid key instead of storing plain text", () => {
    delete process.env.SECRET_ENCRYPTION_KEY;
    expect(() => sealSecret("x")).toThrow(/SECRET_ENCRYPTION_KEY/);
    process.env.SECRET_ENCRYPTION_KEY = Buffer.from("short").toString("base64");
    expect(() => sealSecret("x")).toThrow(/32 byte/);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { decryptPoolCredential, encryptPoolCredential } from "@/lib/pool-credentials";

describe("pool-credentials", () => {
  beforeEach(() => {
    process.env.MIDTRANS_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips a server key", () => {
    const plaintext = "Mid-server-abc123XYZ";
    const stored = encryptPoolCredential(plaintext);
    expect(decryptPoolCredential(stored)).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const plaintext = "Mid-server-abc123XYZ";
    expect(encryptPoolCredential(plaintext)).not.toBe(encryptPoolCredential(plaintext));
  });

  it("throws on tampered ciphertext instead of silently returning garbage", () => {
    const stored = encryptPoolCredential("Mid-server-abc123XYZ");
    const [iv, tag] = stored.split(":");
    const tampered = `${iv}:${tag}:${Buffer.from("tampered").toString("base64")}`;
    expect(() => decryptPoolCredential(tampered)).toThrow();
  });

  it("throws a clear error when the encryption key env var is missing", () => {
    delete process.env.MIDTRANS_CREDENTIAL_ENCRYPTION_KEY;
    expect(() => encryptPoolCredential("x")).toThrow(/MIDTRANS_CREDENTIAL_ENCRYPTION_KEY/);
  });

  it("throws a clear error when the encryption key is the wrong length", () => {
    process.env.MIDTRANS_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(() => encryptPoolCredential("x")).toThrow(/32 byte/);
  });
});

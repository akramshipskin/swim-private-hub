import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, needsTotpSetup, newTotpSecret, otpauthUrl, totpAt, verifyTotp } from "./totp";

// RFC 6238 lampiran B: kunci ASCII "12345678901234567890", SHA-1.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("totp", () => {
  it("matches the RFC 6238 SHA-1 test vectors (8 digits)", () => {
    expect(totpAt(RFC_SECRET, Math.floor(59 / 30), 8)).toBe("94287082");
    expect(totpAt(RFC_SECRET, Math.floor(1111111109 / 30), 8)).toBe("07081804");
    expect(totpAt(RFC_SECRET, Math.floor(20000000000 / 30), 8)).toBe("65353130");
  });

  it("round-trips base32 and produces a 32-char secret (160 bit)", () => {
    const s = newTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(s))).toBe(s);
  });

  it("accepts the current code and one step of clock drift, returning the step", () => {
    const now = 1_700_000_000_000;
    const step = Math.floor(now / 30000);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step), now)).toBe(step);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step - 1), now)).toBe(step - 1);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step + 1), now)).toBe(step + 1);
  });

  it("rejects codes two steps away, wrong codes and malformed input", () => {
    const now = 1_700_000_000_000;
    const step = Math.floor(now / 30000);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step - 2), now)).toBeNull();
    const wrong = String((Number(totpAt(RFC_SECRET, step)) + 1) % 1_000_000).padStart(6, "0");
    expect(verifyTotp(RFC_SECRET, wrong, now)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "12345", now)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "abcdef", now)).toBeNull();
  });

  it("tolerates a space typed in the middle of the code", () => {
    const now = 1_700_000_000_000;
    const code = totpAt(RFC_SECRET, Math.floor(now / 30000));
    expect(verifyTotp(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, now)).not.toBeNull();
  });

  it("builds an otpauth link Google Authenticator understands", () => {
    expect(otpauthUrl("ABC", "admin@x.id")).toBe(
      "otpauth://totp/Swim%20Private%20Hub%3Aadmin%40x.id?secret=ABC&issuer=Swim%20Private%20Hub&algorithm=SHA1&digits=6&period=30"
    );
  });
});

describe("needsTotpSetup", () => {
  it("admin tanpa 2FA dipaksa pasang; admin dengan 2FA tidak", () => {
    expect(needsTotpSetup("ADMIN", null)).toBe(true);
    expect(needsTotpSetup("ADMIN", new Date())).toBe(false);
  });
  it("coach, member, pemilik kolam tidak pernah dipaksa (opsional)", () => {
    for (const role of ["COACH", "MEMBER", "POOL_OWNER"]) expect(needsTotpSetup(role, null)).toBe(false);
  });
});

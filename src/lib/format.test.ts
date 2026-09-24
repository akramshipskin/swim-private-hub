import { describe, expect, it } from "vitest";
import { formNumber, identityTakenWhere, isValidIndonesianPhone, normalizeEmail, normalizePhone, phoneVariants, toProperCase } from "./format";

describe("toProperCase", () => {
  it("capitalizes the first letter of an all-lowercase name", () => {
    expect(toProperCase("hanief akram")).toBe("Hanief Akram");
  });

  it("leaves the rest of each word untouched (does not force-lowercase)", () => {
    expect(toProperCase("TTT architect")).toBe("TTT Architect");
  });

  it("handles a package name starting with a digit", () => {
    expect(toProperCase("8x renang")).toBe("8x Renang");
  });

  it("collapses no whitespace and leaves single words alone", () => {
    expect(toProperCase("bayu")).toBe("Bayu");
  });
});

describe("isValidIndonesianPhone", () => {
  it("accepts a number with leading 0", () => {
    expect(isValidIndonesianPhone("081234567890")).toBe(true);
  });

  it("accepts a number with 62 country code", () => {
    expect(isValidIndonesianPhone("6281234567890")).toBe(true);
  });

  it("accepts a number with +62 country code", () => {
    expect(isValidIndonesianPhone("+6281234567890")).toBe(true);
  });

  it("accepts a number with spaces/dashes as separators", () => {
    expect(isValidIndonesianPhone("0812-3456-7890")).toBe(true);
  });

  it("rejects a number too short to be a real mobile number", () => {
    expect(isValidIndonesianPhone("08123")).toBe(false);
  });

  it("rejects a number without a valid Indonesian prefix", () => {
    expect(isValidIndonesianPhone("12345678900")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidIndonesianPhone("bukan-nomor-hp")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it.each([
    ["081234567890", "081234567890"],
    ["0812-3456-7890", "081234567890"],
    ["+62 812 3456 7890", "081234567890"],
    ["6281234567890", "081234567890"],
    [" (0812) 3456.7890 ", "081234567890"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("returns an invalid number unchanged (trimmed) so validation still rejects it", () => {
    expect(normalizePhone(" 12345 ")).toBe("12345");
  });
});

describe("phoneVariants", () => {
  it("lists the legacy stored forms of the same number", () => {
    expect(phoneVariants("+62 812-3456-7890")).toEqual(["081234567890", "6281234567890", "+6281234567890"]);
  });

  it("returns just the input for a non-phone value", () => {
    expect(phoneVariants("abc")).toEqual(["abc"]);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Budi.Santoso@Example.COM ")).toBe("budi.santoso@example.com");
  });

  it("turns empty/missing into null", () => {
    expect(normalizeEmail("  ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

describe("identityTakenWhere", () => {
  it("matches every phone form and the email case-insensitively", () => {
    expect(identityTakenWhere("081234567890", "budi@example.com")).toEqual({
      OR: [
        { phone: { in: ["081234567890", "6281234567890", "+6281234567890"] } },
        { email: { equals: "budi@example.com", mode: "insensitive" } },
      ],
    });
  });

  it("omits the email condition when there is no email", () => {
    expect(identityTakenWhere("081234567890", null).OR).toHaveLength(1);
  });
});

describe("formNumber", () => {
  const fd = (e: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(e)) f.set(k, v);
    return f;
  };
  it("parses a filled number", () => {
    expect(formNumber(fd({ n: "12" }), "n")).toBe(12);
    expect(formNumber(fd({ n: "0" }), "n")).toBe(0);
  });
  it("treats blank or missing as NaN, not 0", () => {
    expect(formNumber(fd({ n: "" }), "n")).toBeNaN();
    expect(formNumber(fd({ n: "   " }), "n")).toBeNaN();
    expect(formNumber(fd({}), "n")).toBeNaN();
  });
});

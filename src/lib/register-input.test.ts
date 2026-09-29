import { describe, it, expect } from "vitest";
import { checkTextFields, INVALID_BODY_ERROR, isPlausibleEmail, isStringArrayOrMissing, readJsonObject } from "./register-input";

const req = (body: string) => new Request("http://x.test/api", { method: "POST", body });

describe("readJsonObject", () => {
  it("returns the parsed object for valid JSON objects", async () => {
    expect(await readJsonObject(req('{"a":1}'))).toEqual({ a: 1 });
  });
  it.each([["not json"], ["null"], ["[]"], ["123"], ['"str"'], [""]])("returns null for %j", async (raw) => {
    expect(await readJsonObject(req(raw))).toBeNull();
  });
});

describe("checkTextFields", () => {
  const limits = { name: { max: 5, label: "Nama" }, bio: { max: 10, label: "Bio" } };
  it("passes when fields are missing, null, or within the limit", () => {
    expect(checkTextFields({}, limits)).toBeNull();
    expect(checkTextFields({ name: null, bio: "ok" }, limits)).toBeNull();
    expect(checkTextFields({ name: "12345" }, limits)).toBeNull();
  });
  it("rejects non-string values", () => {
    expect(checkTextFields({ name: 123 }, limits)).toBe(INVALID_BODY_ERROR);
    expect(checkTextFields({ bio: { x: 1 } }, limits)).toBe(INVALID_BODY_ERROR);
  });
  it("rejects values longer than the limit, measured after trim", () => {
    expect(checkTextFields({ name: "123456" }, limits)).toBe("Nama maksimal 5 karakter.");
    expect(checkTextFields({ name: "  12345  " }, limits)).toBeNull();
  });
});

describe("isStringArrayOrMissing", () => {
  it("accepts missing, null, and arrays of strings only", () => {
    expect(isStringArrayOrMissing(undefined)).toBe(true);
    expect(isStringArrayOrMissing(null)).toBe(true);
    expect(isStringArrayOrMissing(["a", "b"])).toBe(true);
    expect(isStringArrayOrMissing("a")).toBe(false);
    expect(isStringArrayOrMissing([1])).toBe(false);
  });
});

describe("isPlausibleEmail", () => {
  it("accepts ordinary addresses and rejects obvious junk", () => {
    expect(isPlausibleEmail("a@b.co")).toBe(true);
    expect(isPlausibleEmail("abc")).toBe(false);
    expect(isPlausibleEmail("a@b")).toBe(false);
    expect(isPlausibleEmail("a b@c.com")).toBe(false);
  });
});

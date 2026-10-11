import { describe, expect, it } from "vitest";
import { suggestEmailFix } from "./email-typo";

describe("suggestEmailFix", () => {
  it("menebak salah ketik domain umum", () => {
    expect(suggestEmailFix("budi@gmial.com")).toBe("budi@gmail.com");
    expect(suggestEmailFix(" Budi@Gmail.co ")).toBe("budi@gmail.com");
    expect(suggestEmailFix("sari@yaho.co.id")).toBe("sari@yahoo.co.id");
    expect(suggestEmailFix("ani@hotmial.com")).toBe("ani@hotmail.com");
  });
  it("diam untuk email benar, domain kantor, dan isian belum lengkap", () => {
    expect(suggestEmailFix("budi@gmail.com")).toBeNull();
    expect(suggestEmailFix("hadi@krabat.web.id")).toBeNull();
    expect(suggestEmailFix("budi@")).toBeNull();
    expect(suggestEmailFix("budi")).toBeNull();
    expect(suggestEmailFix("")).toBeNull();
  });
});

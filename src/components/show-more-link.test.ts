import { describe, expect, it } from "vitest";
import { listHref, pageSize } from "./show-more-link";

describe("pageSize", () => {
  it("memakai nilai n yang sah, selain itu ukuran halaman awal", () => {
    expect(pageSize(undefined, 20)).toBe(20);
    expect(pageSize("40", 20)).toBe(40);
    expect(pageSize("5", 20)).toBe(20);
    expect(pageSize("abc", 20)).toBe(20);
    expect(pageSize("1.5", 20)).toBe(20);
    expect(pageSize("99999", 20)).toBe(20);
  });
});

describe("listHref", () => {
  it("membuang parameter kosong dan mempertahankan yang terisi", () => {
    expect(listHref({ q: undefined, n: "14" })).toBe("?n=14");
    expect(listHref({ q: "budi", f: "belum" })).toBe("?q=budi&f=belum");
    expect(listHref({ q: undefined })).toBe("?");
  });
});

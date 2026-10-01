import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
const { shouldTrack } = await import("./meta-pixel");

describe("shouldTrack (Pixel Meta)", () => {
  it("melacak pengunjung belum masuk & member di halaman umum/member", () => {
    expect(shouldTrack("/", "unauthenticated")).toBe(true);
    expect(shouldTrack("/register", "unauthenticated")).toBe(true);
    expect(shouldTrack("/member/paket", "authenticated", "MEMBER")).toBe(true);
  });

  it("tidak melacak coach/kolam/admin di halaman mana pun (pemeriksa 2 Okt: /profil, /milestone)", () => {
    for (const role of ["COACH", "POOL_OWNER", "ADMIN"]) {
      expect(shouldTrack("/profil", "authenticated", role)).toBe(false);
      expect(shouldTrack("/milestone/d1", "authenticated", role)).toBe(false);
      expect(shouldTrack("/", "authenticated", role)).toBe(false);
    }
  });

  it("tidak melacak area staf, halaman keamanan, atau selagi status masuk belum diketahui", () => {
    expect(shouldTrack("/admin", "unauthenticated")).toBe(false);
    expect(shouldTrack("/coach/jadwal", "unauthenticated")).toBe(false);
    expect(shouldTrack("/ganti-password", "authenticated", "MEMBER")).toBe(false);
    expect(shouldTrack("/", "loading")).toBe(false);
  });
});

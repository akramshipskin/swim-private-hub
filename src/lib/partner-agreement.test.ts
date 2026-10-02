import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { PARTNER_AGREEMENTS, needsPartnerAgreement, partnerAgreementData, partnerAgreementFor } from "./partner-agreement";

const original = { coach: PARTNER_AGREEMENTS.COACH.version, pool: PARTNER_AGREEMENTS.POOL_OWNER.version };
afterEach(() => {
  PARTNER_AGREEMENTS.COACH.version = original.coach;
  PARTNER_AGREEMENTS.POOL_OWNER.version = original.pool;
});

describe("perjanjian kemitraan", () => {
  it("belum aktif (versi null): tidak diminta dan tidak dicatat", () => {
    PARTNER_AGREEMENTS.COACH.version = null;
    expect(partnerAgreementFor("COACH")).toBeNull();
    expect(needsPartnerAgreement("COACH", null)).toBe(false);
    expect(partnerAgreementData("COACH", undefined)).toEqual({});
  });

  it("aktif: coach tanpa persetujuan / versi lama diminta setuju, versi sama tidak", () => {
    PARTNER_AGREEMENTS.COACH.version = "Perjanjian Coach v1";
    expect(needsPartnerAgreement("COACH", null)).toBe(true);
    expect(needsPartnerAgreement("COACH", "Perjanjian Coach v0")).toBe(true);
    expect(needsPartnerAgreement("COACH", "Perjanjian Coach v1")).toBe(false);
  });

  it("member dan admin tidak pernah diminta", () => {
    PARTNER_AGREEMENTS.COACH.version = "x";
    PARTNER_AGREEMENTS.POOL_OWNER.version = "y";
    expect(needsPartnerAgreement("MEMBER", null)).toBe(false);
    expect(needsPartnerAgreement("ADMIN", null)).toBe(false);
    expect(partnerAgreementData("MEMBER", false)).toEqual({});
  });

  it("aktif: tanpa centang ditolak, dengan centang mencatat versi peran itu", () => {
    PARTNER_AGREEMENTS.POOL_OWNER.version = "MOU Kolam v1";
    expect(partnerAgreementData("POOL_OWNER", undefined)).toBeNull();
    expect(partnerAgreementData("POOL_OWNER", "true")).toBeNull();
    const now = new Date("2026-10-05T00:00:00Z");
    expect(partnerAgreementData("POOL_OWNER", true, now)).toEqual({ partnerAgreementAcceptedAt: now, partnerAgreementVersion: "MOU Kolam v1" });
  });

  // Aktif sejak 2 Okt: versi asli terisi, berbeda per peran, diawali nama
  // dokumen; akun yang dulunya peran lain (versi peran lain) tetap diminta.
  it("versi yang berlaku: terisi, berbeda, coach tidak dianggap setuju MOU (dan sebaliknya)", () => {
    const coach = original.coach;
    const pool = original.pool;
    expect(coach).toMatch(/^Perjanjian Coach /);
    expect(pool).toMatch(/^MOU Kolam /);
    expect(coach).not.toBe(pool);
    expect(needsPartnerAgreement("COACH", null)).toBe(true);
    expect(needsPartnerAgreement("POOL_OWNER", null)).toBe(true);
    expect(needsPartnerAgreement("COACH", coach)).toBe(false);
    expect(needsPartnerAgreement("POOL_OWNER", pool)).toBe(false);
    expect(needsPartnerAgreement("POOL_OWNER", coach)).toBe(true);
    expect(needsPartnerAgreement("COACH", pool)).toBe(true);
    expect(partnerAgreementData("COACH", true)).toMatchObject({ partnerAgreementVersion: coach });
    expect(partnerAgreementData("COACH", undefined)).toBeNull();
  });

  // Pemeriksa 2 Okt: versi diisi sebelum halaman teksnya ada = orang menyetujui
  // dokumen yang tidak bisa dibuka (404). Tes ini gagal kalau itu terjadi.
  it("perjanjian yang sudah aktif punya halaman teksnya", () => {
    for (const doc of Object.values(PARTNER_AGREEMENTS)) {
      if (doc.version) expect(existsSync(`src/app${doc.href}/page.tsx`), doc.href).toBe(true);
    }
  });
});

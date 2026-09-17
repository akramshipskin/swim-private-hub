import { describe, it, expect } from "vitest";
import { ageFromBirthDate, coachBioLine } from "./coach-bio";

const now = new Date("2026-09-18T00:00:00+07:00");

describe("ageFromBirthDate", () => {
  it("menghitung umur dan belum menambah kalau ulang tahunnya belum lewat", () => {
    expect(ageFromBirthDate(new Date("1996-09-17"), now)).toBe(30);
    expect(ageFromBirthDate(new Date("1996-09-18"), now)).toBe(30);
    expect(ageFromBirthDate(new Date("1996-09-19"), now)).toBe(29);
    expect(ageFromBirthDate(new Date("1996-12-31"), now)).toBe(29);
  });

  it("mengembalikan null untuk kosong atau tanggal tidak masuk akal", () => {
    expect(ageFromBirthDate(null, now)).toBeNull();
    expect(ageFromBirthDate("bukan tanggal", now)).toBeNull();
    expect(ageFromBirthDate(new Date("2030-01-01"), now)).toBeNull();
    expect(ageFromBirthDate(new Date("1850-01-01"), now)).toBeNull();
  });
});

describe("coachBioLine", () => {
  it("menggabungkan umur dan jenis kelamin, melewati yang kosong", () => {
    expect(coachBioLine({ birthDate: new Date("1996-01-01"), gender: "FEMALE" }, now)).toBe("30 tahun · Perempuan");
    expect(coachBioLine({ birthDate: null, gender: "MALE" }, now)).toBe("Laki-laki");
    expect(coachBioLine({ birthDate: new Date("1996-01-01"), gender: null }, now)).toBe("30 tahun");
    expect(coachBioLine({ birthDate: null, gender: null }, now)).toBeNull();
    expect(coachBioLine(null, now)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { parseImportBirthDate, parseParticipantBirthDate, readParticipants } from "./participant-input";

const NOW = new Date("2026-09-30T05:00:00Z");

function fd(rows: { type: string; name?: string; date?: string }[]) {
  const f = new FormData();
  for (const r of rows) {
    f.append("participantType", r.type);
    f.append("participantName", r.name ?? "");
    f.append("participantBirthDate", r.date ?? "");
  }
  return f;
}

describe("readParticipants", () => {
  it("membaca diri sendiri + anak lengkap dengan tanggal lahir, nama anak dirapikan", () => {
    const r = readParticipants(fd([{ type: "self", date: "1990-05-05" }, { type: "child", name: "budi jr", date: "2018-04-01" }]), NOW);
    expect(r.wantsSelf).toBe(true);
    expect(r.selfBirthDate).toEqual(new Date("1990-05-05T00:00:00Z"));
    expect(r.children).toEqual([{ name: "Budi Jr", birthDate: new Date("2018-04-01T00:00:00Z") }]);
  });

  it("menolak baris tanpa tanggal lahir atau tanggal di masa depan", () => {
    expect(() => readParticipants(fd([{ type: "self" }]), NOW)).toThrow("tanggal lahir");
    expect(() => readParticipants(fd([{ type: "child", name: "Ani", date: "2027-01-01" }]), NOW)).toThrow("masa depan");
  });

  it("baris anak tanpa nama dilewati; tanpa baris sama sekali = tidak ada peserta", () => {
    expect(readParticipants(fd([{ type: "child", name: " ", date: "" }]), NOW).children).toEqual([]);
    expect(readParticipants(new FormData(), NOW)).toEqual({ wantsSelf: false, selfBirthDate: null, children: [] });
  });
});

describe("parseImportBirthDate", () => {
  const expected = new Date("2018-07-05T00:00:00Z");
  it("menerima ISO, dd/mm/yyyy, dd-mm-yyyy, dan angka tanggal Excel", () => {
    expect(parseImportBirthDate("2018-07-05", NOW)).toEqual(expected);
    expect(parseImportBirthDate("05/07/2018", NOW)).toEqual(expected);
    expect(parseImportBirthDate("5-7-2018", NOW)).toEqual(expected);
    expect(parseImportBirthDate("43286", NOW)).toEqual(expected);
  });
  it("kosong, sampah, masa depan, atau tidak masuk akal -> null", () => {
    for (const raw of [null, undefined, "", "  ", "kemarin", "2030-01-01", "1800-01-01", "2019"]) {
      expect(parseImportBirthDate(raw, NOW)).toBeNull();
    }
  });
});

describe("parseParticipantBirthDate (dipindah ke modul ini)", () => {
  it("tetap menolak format salah", () => {
    expect(() => parseParticipantBirthDate("17-05-2019", NOW)).toThrow("Isi tanggal lahir");
  });
});

describe("readParticipants: batas nama", () => {
  it("nama peserta lebih dari 100 karakter ditolak; tepat 100 boleh", async () => {
    const { MAX_NAME } = await import("./register-input");
    const fd = (name: string) => {
      const f = new FormData();
      f.append("participantType", "child"); f.append("participantName", name); f.append("participantBirthDate", "2019-05-17");
      return f;
    };
    expect(() => readParticipants(fd("a".repeat(MAX_NAME + 1)))).toThrow("maksimal");
    expect(readParticipants(fd("a".repeat(MAX_NAME))).children).toHaveLength(1);
  });
});


import { describe, expect, it } from "vitest";
import {
  changedPackPrices,
  cheapestPackQuote,
  formatBps,
  isValidPackPrice,
  isValidServiceFeeBps,
  pack8SavingPercent,
  packQuote,
  parsePackPrices,
  pphAmount,
  sessionSplit,
  trialQuote,
} from "./pricing";

const pool = { pricePack4: 260_000, pricePack8: 480_000, serviceFeeBps: 650 };
const coach = { pricePack4: 440_000, pricePack8: 800_000 };

describe("packQuote", () => {
  it("contoh rancangan: paket 8 = 480.000 + 800.000 + 6,5%", () => {
    const q = packQuote(pool, coach, 8)!;
    expect(q).toMatchObject({ poolPrice: 480_000, coachPrice: 800_000, serviceFee: 83_200, total: 1_363_200, durationDays: 90, jatahCancel: 4, isTrial: false });
  });
  it("paket 4 berlaku 60 hari", () => {
    expect(packQuote(pool, coach, 4)).toMatchObject({ durationDays: 60, jatahCancel: 2 });
  });
  it("null bila kolam atau coach belum memasang harga", () => {
    expect(packQuote({ ...pool, pricePack8: null }, coach, 8)).toBeNull();
    expect(packQuote(pool, { ...coach, pricePack4: null }, 4)).toBeNull();
    expect(packQuote(pool, { ...coach, pricePack4: 0 }, 4)).toBeNull();
  });
});

describe("trialQuote", () => {
  it("per sesi paket 4 kolam + coach + biaya layanan", () => {
    const q = trialQuote(pool, coach)!;
    expect(q).toMatchObject({ totalSesi: 1, poolPrice: 65_000, coachPrice: 110_000, serviceFee: 11_375, total: 186_375, isTrial: true, jatahCancel: 0, durationDays: 7 });
  });
  it("null tanpa harga paket 4", () => {
    expect(trialQuote({ ...pool, pricePack4: null }, coach)).toBeNull();
  });
});

describe("pack8SavingPercent", () => {
  it("hemat per sesi paket 8 dibanding paket 4", () => {
    expect(pack8SavingPercent(packQuote(pool, coach, 4)!, packQuote(pool, coach, 8)!)).toBe(8);
  });
  it("0 bila paket 8 tidak lebih murah", () => {
    const dear = { ...coach, pricePack8: 2_000_000 };
    expect(pack8SavingPercent(packQuote(pool, dear, 4)!, packQuote(pool, dear, 8)!)).toBe(0);
  });
});

describe("sessionSplit", () => {
  it("hadir: kolam dan coach per sesi, sisanya SPH", () => {
    expect(sessionSplit({ paid: 1_363_200, totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000, attended: true })).toEqual({
      value: 170_400,
      pool: 60_000,
      coach: 100_000,
      platform: 10_400,
    });
  });
  it("tidak hadir: kolam 0, coach 50%, sisanya SPH", () => {
    expect(sessionSplit({ paid: 1_363_200, totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000, attended: false })).toEqual({
      value: 170_400,
      pool: 0,
      coach: 50_000,
      platform: 120_400,
    });
  });
  it("sisa pembulatan jatuh ke SPH, total tidak melebihi nilai sesi", () => {
    const s = sessionSplit({ paid: 100_003, totalSesi: 3, poolPrice: 40_001, coachPrice: 50_000, attended: true });
    expect(s.pool + s.coach + s.platform).toBe(s.value);
    expect(s).toMatchObject({ value: 33_334, pool: 13_333, coach: 16_666 });
  });
  it("bayar kurang dari harga tersimpan: kredit dibatasi nilai sesi", () => {
    const s = sessionSplit({ paid: 80_000, totalSesi: 1, poolPrice: 60_000, coachPrice: 100_000, attended: true });
    expect(s).toEqual({ value: 80_000, pool: 0, coach: 80_000, platform: 0 });
  });
});

describe("pphAmount", () => {
  it("0,5% dibulatkan", () => {
    expect(pphAmount(60_000, false)).toBe(300);
    expect(pphAmount(99_999, false)).toBe(500);
  });
  it("0 untuk yang bebas potongan atau nominal 0", () => {
    expect(pphAmount(60_000, true)).toBe(0);
    expect(pphAmount(0, false)).toBe(0);
  });
});

describe("validasi", () => {
  it("harga paket bulat 1..50 juta", () => {
    expect(isValidPackPrice(1)).toBe(true);
    expect(isValidPackPrice(0)).toBe(false);
    expect(isValidPackPrice(1.5)).toBe(false);
    expect(isValidPackPrice(50_000_001)).toBe(false);
  });
  it("biaya layanan maks 6,9%", () => {
    expect(isValidServiceFeeBps(690)).toBe(true);
    expect(isValidServiceFeeBps(700)).toBe(false);
    expect(isValidServiceFeeBps(-1)).toBe(false);
  });
  it("formatBps", () => {
    expect(formatBps(650)).toBe("6,5%");
    expect(formatBps(600)).toBe("6%");
  });
});

describe("parsePackPrices", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  it("kosong = null, angka valid tersimpan", () => {
    expect(parsePackPrices(fd({ pricePack4: "", pricePack8: "800000" }))).toEqual({ pricePack4: null, pricePack8: 800_000 });
  });
  it("menolak nol, pecahan, dan bukan angka", () => {
    expect(parsePackPrices(fd({ pricePack4: "0", pricePack8: "" }))).toHaveProperty("error");
    expect(parsePackPrices(fd({ pricePack4: "1.5", pricePack8: "" }))).toHaveProperty("error");
    expect(parsePackPrices(fd({ pricePack4: "abc", pricePack8: "" }))).toHaveProperty("error");
  });
});

describe("changedPackPrices", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  it("hanya menulis harga yang diubah di form", () => {
    expect(changedPackPrices(fd({ origPack4: "800000", origPack8: "" }), { pricePack4: 800_000, pricePack8: 1_500_000 })).toEqual({ pricePack8: 1_500_000 });
    expect(changedPackPrices(fd({ origPack4: "800000", origPack8: "1500000" }), { pricePack4: 800_000, pricePack8: 1_500_000 })).toEqual({});
    expect(changedPackPrices(fd({ origPack4: "800000", origPack8: "" }), { pricePack4: null, pricePack8: null })).toEqual({ pricePack4: null });
  });
});

describe("cheapestPackQuote", () => {
  it("memilih total termurah dan menyebut ukuran paketnya", () => {
    expect(cheapestPackQuote(pool, [coach, { pricePack4: 300_000, pricePack8: 900_000 }])).toEqual({ total: 596_400, sessions: 4 });
  });
  it("coach tanpa harga dilewati; tanpa coach berharga = null", () => {
    expect(cheapestPackQuote(pool, [{ pricePack4: null, pricePack8: null }])).toBeNull();
    expect(cheapestPackQuote(pool, [])).toBeNull();
    expect(cheapestPackQuote({ ...pool, pricePack4: null }, [coach])).toEqual({ total: 1_363_200, sessions: 8 });
  });
});

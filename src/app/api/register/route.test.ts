import { describe, it, expect, vi } from "vitest";

// Hanya jalur penolakan awal yang diuji di sini (sebelum menyentuh DB), jadi
// prisma cukup dimock kosong; kalau kode salah sampai ke DB, tes ini gagal.
vi.mock("@/lib/prisma", () => ({ prisma: new Proxy({}, { get() { throw new Error("DB tidak boleh disentuh"); } }) }));

import { POST as registerMember } from "./route";
import { POST as registerCoach } from "../register-coach/route";
import { POST as registerPool } from "../register-pool/route";

const post = (handler: (r: Request) => Promise<Response>, raw: string) =>
  handler(new Request("http://x.test/api", { method: "POST", body: raw }));
const json = (v: unknown) => JSON.stringify(v);

const memberOk = { name: "Uji", phone: "081234567890", password: "abcdefgh1", wantsSelf: true, selfBirthDate: "1990-01-01", acceptedTerms: true };

describe.each([
  ["member", registerMember],
  ["coach", registerCoach],
  ["pool", registerPool],
] as const)("POST /api/register (%s): bentuk body", (_name, handler) => {
  it.each([["bukan JSON", "not json"], ["null", "null"], ["array", "[]"], ["angka", "5"]])("%s -> 400, bukan 500", async (_l, raw) => {
    const res = await post(handler, raw);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format permintaan tidak valid.");
  });
});

describe("POST /api/register (member): batas input", () => {
  it("menolak nama lebih dari 100 karakter", async () => {
    const res = await post(registerMember, json({ ...memberOk, name: "A".repeat(101) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Nama maksimal 100 karakter.");
  });
  it("menolak password bukan teks", async () => {
    const res = await post(registerMember, json({ ...memberOk, password: 12345678 }));
    expect(res.status).toBe(400);
  });
  it("menolak password lebih dari 72 karakter", async () => {
    const res = await post(registerMember, json({ ...memberOk, password: "a".repeat(73) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Password maksimal 72 karakter.");
  });
  it("menolak daftar anak yang bukan array atau terlalu banyak", async () => {
    expect((await post(registerMember, json({ ...memberOk, children: "x" }))).status).toBe(400);
    const many = Array.from({ length: 11 }, () => ({ name: "Adik", birthDate: "2020-01-01" }));
    expect((await post(registerMember, json({ ...memberOk, children: many }))).status).toBe(400);
  });
  it("menolak nama anak terlalu panjang", async () => {
    const res = await post(registerMember, json({ ...memberOk, children: [{ name: "B".repeat(101), birthDate: "2020-01-01" }] }));
    expect(res.status).toBe(400);
  });
  it("menolak kota kosong atau di luar daftar (Hadi 3 Okt)", async () => {
    for (const city of [undefined, "", "Semarang", 5]) {
      const res = await post(registerMember, json({ ...memberOk, city }));
      expect(res.status).toBe(400);
    }
    expect((await (await post(registerMember, json({ ...memberOk, city: "Paris" }))).json()).error).toBe("Pilih kota domisili dari daftar");
  });
  it("menolak email yang bentuknya jelas salah (sebelum cek DB)", async () => {
    const res = await post(registerMember, json({ ...memberOk, city: "Jakarta", email: "bukan-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Format email tidak valid");
  });
});

describe("POST /api/register-coach dan register-pool: batas input", () => {
  const coachOk = { name: "Coach Uji", phone: "081234567891", password: "abcdefgh1", specialties: ["Gaya bebas"], acceptedTerms: true };
  it("coach: bio terlalu panjang ditolak", async () => {
    const res = await post(registerCoach, json({ ...coachOk, bio: "x".repeat(1001) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Bio maksimal 1000 karakter.");
  });
  it("coach: keahlian bukan array teks ditolak", async () => {
    expect((await post(registerCoach, json({ ...coachOk, specialties: "Gaya bebas" }))).status).toBe(400);
    expect((await post(registerCoach, json({ ...coachOk, specialties: [1] }))).status).toBe(400);
  });
  const poolOk = { ownerName: "Pemilik Uji", phone: "081234567892", password: "abcdefgh1", poolName: "Kolam Uji", address: "Jl. Uji", openTime: "06:00", closeTime: "21:00", acceptedTerms: true };
  it("kolam: alamat & nama kolam terlalu panjang ditolak", async () => {
    expect((await post(registerPool, json({ ...poolOk, address: "a".repeat(301) }))).status).toBe(400);
    expect((await post(registerPool, json({ ...poolOk, poolName: "k".repeat(101) }))).status).toBe(400);
  });
  it("kolam: kota, harga, dan kapasitas harian wajib valid (Hadi 3 Okt)", async () => {
    const ok = { ...poolOk, city: "Depok", pricePack4: 260000, dailyCapacity: 10 };
    for (const bad of [{ city: "Semarang" }, { city: undefined }, { pricePack4: null }, { pricePack4: 260500 }, { dailyCapacity: 0 }, { dailyCapacity: "x" }, { dailyCapacity: undefined }]) {
      expect((await post(registerPool, json({ ...ok, ...bad }))).status).toBe(400);
    }
  });
  it("kolam: field teks berupa objek ditolak, bukan 500", async () => {
    expect((await post(registerPool, json({ ...poolOk, address: { a: 1 } }))).status).toBe(400);
    expect((await post(registerPool, json({ ...poolOk, description: 5 }))).status).toBe(400);
  });
});

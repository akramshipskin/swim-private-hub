import { Prisma } from "@/generated/prisma/client";

// Kondisi "paket beneran bisa dipake" -- status ACTIVE doang gak cukup,
// paket bisa kehabisan sesi atau kedaluwarsa tapi status-nya di DB tetep
// "ACTIVE" selamanya (gak ada cron yang nge-flip ke EXPIRED otomatis).
// Satu sumber kebenaran, dipake di query booking (enforce) DAN di semua
// tampilan (member, admin) -- biar gak nyimpang: kalau di sini bilang
// aktif, booking pasti lolos.
//
// Function, bukan konstanta -- `new Date()` di konstanta level modul cuma
// kejalan SEKALI pas modul di-load, jadi di instance server yang idup lama
// (warm Vercel function) "sekarang"-nya kebeku di jam server nyala: paket
// yang expired setelah itu masih dianggap aktif & masih bisa dibooking.
export function usablePackageConditions(): Prisma.PackageWhereInput {
  return {
    status: "ACTIVE",
    sisaSesi: { gt: 0 },
    OR: [{ expiredDate: null }, { expiredDate: { gte: new Date() } }],
  };
}

export function activePackageWhere(memberId: string): Prisma.PackageWhereInput {
  return { memberId, ...usablePackageConditions() };
}

type PackageLike = { status: string; sisaSesi: number; expiredDate: Date | null };

// Versi in-memory dari usablePackageConditions (aturan yang sama persis) buat
// data yang sudah terlanjur diambil dari DB. Kalau aturan di atas berubah,
// ubah di sini juga -- dijaga tes yang membandingkan keduanya.
export function isUsablePackage(p: PackageLike, now: Date = new Date()): boolean {
  return p.status === "ACTIVE" && p.sisaSesi > 0 && (p.expiredDate === null || p.expiredDate >= now);
}

// Paket yang ditampilkan admin untuk 1 peserta di 1 kolam. Semua paket yang
// masih bisa dipakai (bisa lebih dari satu); kalau tidak ada satu pun, yang
// terbaru saja. `newestFirst` HARUS berurutan dari yang paling baru dibuat.
// Bug sweep 24 Sep: dulu cuma "yang terbaru" -- member yang klik Beli lalu tidak
// jadi bayar bikin paket menunggu-bayar menutupi paket aktifnya, dan admin
// tidak bisa lagi menyunting paket aktif itu.
export function packagesToShow<T extends PackageLike>(newestFirst: T[], now: Date = new Date()): T[] {
  const usable = newestFirst.filter((p) => isUsablePackage(p, now));
  if (usable.length > 0) return usable;
  return newestFirst.length > 0 ? [newestFirst[0]] : [];
}

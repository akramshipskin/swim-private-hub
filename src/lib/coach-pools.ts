// Coach memilih sendiri kolam tempat ia mengajar (Hadi 3 Okt): kolam tidak
// menyetujui coach. Tautan coach-kolam (PoolAffiliation) = izin buka slot dan
// pasangan paket yang bisa dibeli member. Admin tetap bisa menautkan/mencabut
// lewat Kelola Kolam (jalur cadangan, tanpa penjaga di bawah).
import { prisma } from "@/lib/prisma";
import { removeOpenSlots } from "@/lib/availability";
import { STALE_PAYMENT_MS } from "@/lib/stale-payments";
import { notifyUser } from "@/lib/notify";
import { PACK_SIZES, packQuote } from "@/lib/pricing";
import { meetsOpenSlotRule, openSlotStats, pairKey } from "@/lib/coach-open-slots";

export type PickResult = "OK" | "POOL_UNAVAILABLE" | "COACH_INACTIVE";
export type ReleaseResult = "OK" | "NOT_PICKED" | "HAS_MEMBERS";

export async function pickCoachPool(coachId: string, poolId: string): Promise<PickResult> {
  const coach = await prisma.user.findFirst({
    where: { id: coachId, role: "COACH", isActive: true, coachProfile: { isActive: true } },
    select: { id: true },
  });
  if (!coach) return "COACH_INACTIVE";
  const pool = await prisma.pool.findFirst({ where: { id: poolId, isActive: true }, select: { id: true } });
  if (!pool) return "POOL_UNAVAILABLE";
  // Dua klik bersamaan: yang kalah kena unique (P2002) = tujuan sudah tercapai.
  const created = await prisma.poolAffiliation
    .create({ data: { poolId, coachId } })
    .then(() => true)
    .catch((err: { code?: string }) => {
      if (err?.code !== "P2002") throw err;
      return false;
    });
  if (created) await notifyWaitlistForPool(poolId);
  return "OK";
}

// Paket yang masih mengikat coach ke kolam itu: aktif dan belum lewat masa
// berlaku, atau menunggu bayar yang masih bisa dilunasi (batas Midtrans 24 jam
// + jeda), atau pengajuan ganti coach KE coach ini di kolam itu yang masih jalan.
function bindingWhere(coachId: string, poolId: string, now: Date) {
  return {
    packages: {
      coachId,
      poolId,
      OR: [
        { status: "ACTIVE" as const, OR: [{ expiredDate: null }, { expiredDate: { gt: now } }] },
        { status: "PENDING_PAYMENT" as const, createdAt: { gt: new Date(now.getTime() - STALE_PAYMENT_MS) } },
      ],
    },
    coachChanges: {
      toCoachId: coachId,
      status: { in: ["PENDING" as const, "AWAITING_PAYMENT" as const] },
      package: { poolId },
    },
  };
}

// Lepas kolam: ditolak selama masih ada member yang terikat ke coach di kolam
// itu. Baris tautan dikunci (FOR UPDATE) dan checkout mengunci baris yang sama
// (FOR SHARE), jadi pembelian paket yang berjalan bersamaan selalu terlihat
// atau gagal karena tautannya sudah hilang.
export async function releaseCoachPool(coachId: string, poolId: string, now = new Date()): Promise<ReleaseResult> {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "PoolAffiliation" WHERE "poolId" = ${poolId} AND "coachId" = ${coachId} FOR UPDATE`;
    if (locked.length === 0) return "NOT_PICKED";
    const w = bindingWhere(coachId, poolId, now);
    const [pkgs, changes] = await Promise.all([
      tx.package.count({ where: w.packages }),
      tx.coachChangeRequest.count({ where: w.coachChanges }),
    ]);
    if (pkgs + changes > 0) return "HAS_MEMBERS";
    await tx.poolAffiliation.delete({ where: { id: locked[0].id } });
    // ponytail: slot yang dibuat bersamaan dengan lepas kolam bisa tertinggal
    // terbuka; tidak bisa dibeli/dibooking karena tautan & paketnya tidak ada.
    await removeOpenSlots({ coachId, poolId, startTime: { gt: now } }, tx);
    return "OK";
  });
}

// Daftar tunggu kota (Hadi 3 Okt): member yang menunggu di sebuah kota diberi
// tahu sekali, begitu kota itu punya paket yang bisa dibeli: kolam aktif + coach
// aktif yang memilih kolam itu, dengan harga ukuran paket YANG SAMA (aturan
// packQuote, sama dengan halaman Paket member). Dipanggil di semua jalur yang
// bisa membuka paket pertama: coach memilih kolam, coach menambah jam kosong,
// harga coach/kolam diubah, kota kolam diisi, admin menautkan coach, admin
// mengaktifkan kolam/coach.
// ponytail: push dikirim berurutan di dalam permintaan pemicu; bila daftar
// tunggu ratusan orang, pindahkan ke pekerjaan latar.
export async function cityHasOffer(city: string) {
  const pairs = await prisma.poolAffiliation.findMany({
    where: {
      pool: { city, isActive: true },
      coach: { role: "COACH", isActive: true, coachProfile: { isActive: true } },
    },
    select: {
      poolId: true,
      coachId: true,
      pool: { select: { name: true, pricePack4: true, pricePack8: true, serviceFeeBps: true } },
      coach: { select: { coachProfile: { select: { pricePack4: true, pricePack8: true } } } },
    },
  });
  const priced = pairs.filter(({ pool, coach }) => PACK_SIZES.some((size) => packQuote(pool, coach.coachProfile!, size)));
  // Sama dengan halaman Paket: coach juga harus punya cukup jam kosong.
  const stats = await openSlotStats(priced.map(({ coachId, poolId }) => ({ coachId, poolId })));
  return priced.find(({ coachId, poolId }) => meetsOpenSlotRule(stats.get(pairKey(coachId, poolId))))?.pool ?? null;
}

export async function notifyCityWaitlist(city: string) {
  const available = await cityHasOffer(city);
  if (!available) return 0;
  const waiting = await prisma.cityWaitlist.findMany({ where: { city, notifiedAt: null }, select: { id: true, userId: true } });
  let sent = 0;
  for (const w of waiting) {
    // Tandai dulu, baru kirim: dua pemicu bersamaan tidak mengirim dua kali.
    const claimed = await prisma.cityWaitlist.updateMany({ where: { id: w.id, notifiedAt: null }, data: { notifiedAt: new Date() } });
    if (claimed.count === 1) {
      sent++;
      await notifyUser(w.userId, `Les renang sudah tersedia di ${city}`, `Coach sudah mengajar di ${available.name}. Lihat paketnya sekarang.`, "/member/paket");
    }
  }
  return sent;
}

// Pemicu per kolam / per coach: cek kota-kota yang terdampak.
export async function notifyWaitlistForPool(poolId: string) {
  const city = (await prisma.pool.findUnique({ where: { id: poolId }, select: { city: true } }))?.city;
  return city ? notifyCityWaitlist(city) : 0;
}
export async function notifyWaitlistForCoach(coachId: string) {
  const pools = await prisma.pool.findMany({ where: { affiliations: { some: { coachId } }, city: { not: null } }, select: { city: true }, distinct: ["city"] });
  for (const { city } of pools) await notifyCityWaitlist(city!);
}

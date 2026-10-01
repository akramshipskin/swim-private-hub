// Saldo member (Hadi 2 Okt): masuk dari selisih ganti ke coach lebih murah,
// dipakai otomatis saat membeli paket / tambah bayar ganti coach, tidak bisa
// dicairkan. User.memberBalance = jumlah MemberWalletTransaction (buku besar).
// Semua fungsi WAJIB dipanggil di dalam transaksi yang sama dengan perubahan
// yang memicunya.
import type { Prisma, MemberWalletType } from "@/generated/prisma/client";

type Refs = { packageId?: string; coachChangeRequestId?: string; note?: string };
// Catatan: PURCHASE dengan note di atas tetap dihitung di heldMemberBalance (type PURCHASE).

export async function creditMember(
  tx: Prisma.TransactionClient,
  memberId: string,
  amount: number,
  type: Extract<MemberWalletType, "COACH_CHANGE_CREDIT" | "PURCHASE_REFUND">,
  refs: Refs = {}
) {
  if (!Number.isInteger(amount) || amount <= 0) return;
  await tx.user.update({ where: { id: memberId }, data: { memberBalance: { increment: amount } } });
  await tx.memberWalletTransaction.create({ data: { memberId, type, amount, ...refs } });
}

// Ambil saldo sebanyak-banyaknya sampai `max` (aturan Hadi: saldo terpakai
// dulu, sisanya lewat Midtrans). Baris user dikunci supaya dua pembelian
// bersamaan tidak memakai saldo yang sama. Mengembalikan jumlah yang terpakai.
export async function spendMemberBalance(tx: Prisma.TransactionClient, memberId: string, max: number, refs: Refs = {}) {
  const [row] = await tx.$queryRaw<{ memberBalance: number }[]>`SELECT "memberBalance" FROM "User" WHERE id = ${memberId} FOR UPDATE`;
  const used = Math.max(0, Math.min(row?.memberBalance ?? 0, max));
  if (used === 0) return 0;
  await tx.user.update({ where: { id: memberId }, data: { memberBalance: { decrement: used } } });
  await tx.memberWalletTransaction.create({ data: { memberId, type: "PURCHASE", amount: -used, ...refs } });
  return used;
}

// Saldo yang masih "tertahan" di sebuah pembelian/tambah bayar: terpakai
// dikurangi yang sudah dikembalikan (dihitung bersih, karena member bisa
// mencoba bayar lagi setelah percobaan sebelumnya gagal).
export async function heldMemberBalance(tx: Prisma.TransactionClient, refs: { packageId: string; coachChangeRequestId?: string }) {
  const where = { packageId: refs.packageId, coachChangeRequestId: refs.coachChangeRequestId ?? null };
  const [spent, back] = await Promise.all([
    tx.memberWalletTransaction.aggregate({ where: { ...where, type: "PURCHASE" }, _sum: { amount: true } }),
    tx.memberWalletTransaction.aggregate({ where: { ...where, type: "PURCHASE_REFUND" }, _sum: { amount: true } }),
  ]);
  return -(spent._sum.amount ?? 0) - (back._sum.amount ?? 0);
}

// Kembalikan saldo yang terpakai untuk pembelian/tambah bayar yang gagal,
// paling banyak sebesar yang masih tertahan (webhook bisa datang berulang).
export async function refundMemberBalanceOnce(
  tx: Prisma.TransactionClient,
  memberId: string,
  amount: number,
  refs: { packageId: string; coachChangeRequestId?: string }
) {
  if (!(amount > 0)) return;
  const refund = Math.min(amount, await heldMemberBalance(tx, refs));
  if (refund <= 0) return;
  await creditMember(tx, memberId, refund, "PURCHASE_REFUND", { ...refs, note: "Pembayaran gagal/kedaluwarsa, saldo dikembalikan" });
}

// Pembayaran yang sempat dianggap gagal (saldonya sudah dikembalikan) ternyata
// lunas belakangan: ambil lagi saldo yang dulu terpakai. Mengembalikan
// kekurangan kalau saldo member sudah terpakai untuk hal lain (perlu dicek admin).
export async function reclaimRefundedBalance(
  tx: Prisma.TransactionClient,
  memberId: string,
  expected: number,
  refs: { packageId: string; coachChangeRequestId?: string }
) {
  if (!(expected > 0)) return 0;
  const missing = expected - (await heldMemberBalance(tx, refs));
  if (missing <= 0) return 0;
  const taken = await spendMemberBalance(tx, memberId, missing, { ...refs, note: "Pembayaran ternyata lunas, saldo dipakai lagi" });
  return missing - taken;
}

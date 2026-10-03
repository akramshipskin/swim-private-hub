// Audit kecocokan buku besar uang (BACA SAJA). Hanya untuk database lokal (DATABASE_URL harus localhost).
//   node --env-file=.env scripts/audit-uang.mjs
// Memeriksa: saldo kolam/coach = jumlah catatan transaksinya; pembagian tiap sesi (Hadir / Tidak Hadir /
// belum ditandai / batal) sesuai aturan; PPN 11% (atau 12% untuk baris sebelum 30 Sep) dari komisi platform;
// komisi afiliasi dibayar dari bagian platform; pencairan tercatat sesuai statusnya; sisa sesi paket;
// pembayaran sukses = paket tidak lagi menunggu bayar. Keluar dengan kode 1 bila ada yang tidak cocok.
import pg from "pg";

const url = process.env.DATABASE_URL ?? "";
// Production hanya dengan AUDIT_PROD=1 (dijalankan Hadi); semua kueri di dalam transaksi baca-saja.
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && process.env.AUDIT_PROD !== "1") {
  console.error("Ditolak: hanya untuk database lokal (production: set AUDIT_PROD=1).");
  process.exit(1);
}
const db = new pg.Client({ connectionString: url.replace(/\?.*$/, ""), ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
await db.query("BEGIN READ ONLY");
const q = async (sql, args = []) => (await db.query(sql, args)).rows;
const problems = [];
const notes = [];
const bad = (area, msg) => problems.push(`[${area}] ${msg}`);

// 1-2. Saldo tersimpan = jumlah catatan.
for (const [label, table, col] of [["kolam", "Pool", "poolId"], ["coach", "CoachProfile", "coachProfileId"]]) {
  const rows = await q(`SELECT o.id, o."walletBalance" AS bal, COALESCE(SUM(w.amount),0)::int AS ledger
    FROM "${table}" o LEFT JOIN "WalletTransaction" w ON w."${col}" = o.id GROUP BY o.id`);
  for (const r of rows) if (r.bal !== r.ledger) bad("saldo", `${label} ${r.id}: tersimpan ${r.bal}, catatan ${r.ledger}`);
  notes.push(`${label}: ${rows.length} dompet dicek`);
}

// 3. Pembagian per sesi.
const bookings = await q(`
  SELECT b.id, b.status, b.attended, p."totalSesi", p."isTrial", p."isSingleSession",
    -- Harga kolam periode sesi: harga sebelum pindah kolam pertama setelah sesi
    -- (ganti coach tanpa biaya bisa pindah kolam); sama dengan pricesForSessionCoach.
    COALESCE((SELECT c2."oldPoolPrice" FROM "CoachChangeRequest" c2 WHERE c2."packageId" = p.id AND c2.status = 'COMPLETED'
      AND c2."completedAt" >= a."startTime" AND c2."oldPoolPrice" IS NOT NULL ORDER BY c2."completedAt" LIMIT 1), p."poolPrice") AS poolprice,
    a."coachId" AS slotcoach,
    COALESCE(bool_and(w."poolId" = a."poolId") FILTER (WHERE w."poolId" IS NOT NULL), true) AS poolok,
    -- Harga menurut WAKTU sesi: sesi sebelum sebuah ganti coach selesai memakai harga
    -- sebelum ganti itu (dan harus diajar coach lama); sesudahnya harga paket sekarang.
    CASE WHEN nx.id IS NOT NULL THEN (CASE WHEN nx."fromCoachId" = a."coachId" THEN nx."oldCoachPrice" END)
         WHEN p."coachId" = a."coachId" OR p."coachId" IS NULL THEN p."coachPrice" END AS coachprice,
    CASE WHEN nx.id IS NOT NULL THEN (CASE WHEN nx."fromCoachId" = a."coachId" THEN nx."oldServiceFee" END)
         WHEN p."coachId" = a."coachId" OR p."coachId" IS NULL THEN p."serviceFee" END AS servicefee,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='PPH_WITHHELD' AND w."poolId" IS NOT NULL),0)::int AS pphpool,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='PPH_WITHHELD' AND w."coachProfileId" IS NOT NULL),0)::int AS pphcoach,
    (SELECT pay.amount FROM "Payment" pay WHERE pay."packageId" = p.id AND pay.status = 'SUCCESS' ORDER BY pay."createdAt" LIMIT 1) AS paid,
    (SELECT pay."paidAt" FROM "Payment" pay WHERE pay."packageId" = p.id AND pay.status = 'SUCCESS' ORDER BY pay."createdAt" LIMIT 1) AS paidat,
    b."attendedAt" AS attendedat,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='SESSION_REVENUE'),0)::int AS pool,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='SESSION_PAYOUT'),0)::int AS coach,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='PLATFORM_REVENUE'),0)::int AS net,
    COALESCE(SUM(w.amount) FILTER (WHERE w.type='PLATFORM_TAX'),0)::int AS tax,
    MIN(w."createdAt") FILTER (WHERE w.type='PLATFORM_TAX' AND w.amount > 0) AS taxAt
  FROM "Booking" b JOIN "Package" p ON p.id = b."packageId" JOIN "Availability" a ON a.id = b."availabilityId"
  LEFT JOIN LATERAL (SELECT c.id, c."fromCoachId", c."oldCoachPrice", c."oldServiceFee" FROM "CoachChangeRequest" c
    WHERE c."packageId" = p.id AND c.status = 'COMPLETED' AND c."completedAt" >= a."startTime" ORDER BY c."completedAt" LIMIT 1) nx ON true
  LEFT JOIN "WalletTransaction" w ON w."bookingId" = b.id
  GROUP BY b.id, p.id, a.id, nx.id, nx."fromCoachId", nx."oldCoachPrice", nx."oldServiceFee"`);
// PPN 11% mulai dari commit ae6e433 (30 Sep 2026 22:01 WIB); baris sebelumnya memakai 12%.
const PPN_11_SINCE = new Date("2026-09-30T22:01:17+07:00");
let checked = 0;
for (const b of bookings) {
  const total = b.pool + b.coach + b.net + b.tax;
  const marked = b.attended !== null && b.status !== "CANCELLED";
  if (!marked || b.paid == null) {
    if (total !== 0 || b.pool || b.coach || b.net || b.tax) bad("sesi", `${b.id}: tidak ditandai/batal/tanpa bayar tapi ada uang tercatat (kolam ${b.pool}, coach ${b.coach}, platform ${b.net}+${b.tax})`);
    continue;
  }
  // Pembayaran yang tercatat SETELAH sesi ditandai: saat ditandai paket belum berbayar, jadi aturan
  // "tanpa pembayaran tidak dibagi" berlaku (data uji yang menyisipkan pembayaran belakangan).
  if (total === 0 && b.paidat && b.attendedat && new Date(b.paidat) > new Date(b.attendedat)) {
    notes.push(`sesi ${b.id}: pembayaran tercatat setelah sesi ditandai, uang tidak dibagi (sesuai aturan; cek asal datanya)`);
    continue;
  }
  checked++;
  // Paket model harga-dari-coach dibagi dari harga tersimpan (sebagian bisa dibayar saldo member).
  const v = b.poolprice != null && b.coachprice != null && b.servicefee != null
    ? Math.floor((b.poolprice + b.coachprice + b.servicefee) / b.totalSesi)
    : Math.floor(b.paid / b.totalSesi);
  if (total !== v) bad("sesi", `${b.id}: total dibagi ${total} != nilai sesi ${v} (bayar ${b.paid}, ${b.totalSesi} sesi)`);
  if (b.pool < 0 || b.coach < 0 || b.net < 0 || b.tax < 0) bad("sesi", `${b.id}: ada bagian negatif (kolam ${b.pool}, coach ${b.coach}, platform ${b.net}, PPN ${b.tax})`);
  if (!b.poolok) bad("sesi", `${b.id}: uang kolam masuk ke kolam lain, bukan kolam tempat sesi berlangsung`);
  if (b.attended === false && b.pool !== 0) bad("sesi", `${b.id}: Tidak Hadir tapi kolam dapat ${b.pool}`);
  // Model harga-dari-coach (2 Okt): bagian tetap per sesi dari harga yang disalin saat beli,
  // potongan PPh 0,5% (atau 0 bila bebas), dan sesi hanya dengan coach paketnya.
  if (b.poolprice != null && (b.coachprice == null || b.servicefee == null)) {
    bad("sesi", `${b.id}: paket pilih coach tapi sesi dengan coach ${b.slotcoach} yang bukan coach paket ini (dan tidak tercatat ganti coach)`);
  } else if (b.poolprice != null && b.coachprice != null) {

    let coachExp = Math.floor(b.coachprice / b.totalSesi);
    let poolExp = b.attended ? Math.floor(b.poolprice / b.totalSesi) : 0;
    if (!b.attended) coachExp = Math.floor(coachExp * 50 / 100);
    coachExp = Math.min(coachExp, v);
    poolExp = Math.min(poolExp, v - coachExp);
    if (b.pool !== poolExp || b.coach !== coachExp) bad("sesi", `${b.id}: paket pilih coach, kolam ${b.pool}/${poolExp}, coach ${b.coach}/${coachExp} (tercatat/harusnya)`);
    for (const [who, gross, pph] of [["kolam", b.pool, b.pphpool], ["coach", b.coach, b.pphcoach]]) {
      const full = -Math.round(gross * 50 / 10000);
      if (pph !== 0 && pph !== full) bad("PPh", `${b.id}: potongan ${who} ${pph}, harusnya 0 (bebas) atau ${full}`);
    }
  } else if (b.pphpool || b.pphcoach) bad("PPh", `${b.id}: paket lama tapi ada potongan PPh`);
  const platform = b.net + b.tax;
  const t11 = Math.round((platform * 11) / 111), t12 = Math.round((platform * 12) / 112);
  if (b.tax !== t11 && b.tax !== t12) bad("PPN", `${b.id}: PPN ${b.tax} dari komisi ${platform} (harusnya ${t11} untuk 11% atau ${t12} untuk 12%)`);
  else if (b.tax !== t11 && b.taxat && new Date(b.taxat) >= PPN_11_SINCE) bad("PPN", `${b.id}: dicatat ${b.taxat.toISOString?.() ?? b.taxat} memakai 12% padahal sejak 30 Sep 11%`);
}
notes.push(`sesi: ${bookings.length} booking, ${checked} bertanda dan berbayar dicek pembagiannya`);

// 3b. Ganti coach tanpa biaya: saldo member yang dikredit = selisih yang tercatat (sekali).
const fc = await q(`SELECT c.id, c.amount, COALESCE((SELECT SUM(m.amount) FROM "MemberWalletTransaction" m WHERE m."coachChangeRequestId" = c.id AND m.type = 'COACH_CHANGE_CREDIT'),0)::int AS credited
  FROM "CoachChangeRequest" c WHERE c.free = true AND c.status = 'COMPLETED'`);
for (const c of fc) if (c.credited !== Math.max(0, -(c.amount ?? 0))) bad("ganti gratis", `${c.id}: saldo member dikredit ${c.credited}, harusnya ${Math.max(0, -(c.amount ?? 0))}`);
notes.push(`ganti coach tanpa biaya: ${fc.length} dicek`);

// 4. Afiliasi: tiap komisi yang cair punya pasangan pengurang platform senilai sama.
const aff = await q(`SELECT
  (SELECT COALESCE(SUM(amount),0)::int FROM "WalletTransaction" WHERE type='AFFILIATE_COMMISSION') AS paid,
  (SELECT COALESCE(-SUM(amount),0)::int FROM "WalletTransaction" WHERE type='PLATFORM_REVENUE' AND "bookingId" IS NULL AND note = 'Komisi afiliasi dibayar') AS fromPlatform,
  (SELECT COALESCE(SUM(amount),0)::int FROM "AffiliateCommission" WHERE status='RELEASED') AS released`);
const a = aff[0];
if (a.paid !== a.released) bad("afiliasi", `komisi tercatat di dompet ${a.paid} != komisi berstatus cair ${a.released}`);
if (a.paid !== a.fromplatform) notes.push(`afiliasi: pengurang platform bertanda khusus ${a.fromplatform} vs komisi ${a.paid} (cek teks catatan AFFILIATE_PAYOUT_NOTE bila beda)`);

// 5. Pencairan.
const wd = await q(`SELECT r.id, r.status, r.amount, COALESCE(SUM(w.amount),0)::int AS ledger
  FROM "WithdrawalRequest" r LEFT JOIN "WalletTransaction" w ON w."withdrawalRequestId" = r.id GROUP BY r.id`);
for (const r of wd) {
  const expect = r.status === "FAILED" ? 0 : -r.amount;
  if (r.ledger !== expect) bad("pencairan", `${r.id} (${r.status}, ${r.amount}): catatan ${r.ledger}, harusnya ${expect}`);
}
notes.push(`pencairan: ${wd.length} pengajuan dicek`);

// 6. Sisa sesi paket = total - booking yang tidak batal.
const pk = await q(`SELECT p.id, p."totalSesi", p."sisaSesi", p.status, COUNT(b.id) FILTER (WHERE b.status <> 'CANCELLED')::int AS used
  FROM "Package" p LEFT JOIN "Booking" b ON b."packageId" = p.id GROUP BY p.id`);
for (const p of pk) if (p.sisaSesi !== p.totalSesi - p.used) notes.push(`paket ${p.id} (${p.status}): sisa ${p.sisaSesi}, total ${p.totalSesi} - terpakai ${p.used} = ${p.totalSesi - p.used} (bisa karena admin mengubah paket; cek manual)`);
for (const p of pk) if (p.sisaSesi < 0 || p.sisaSesi > p.totalSesi) bad("paket", `${p.id}: sisa sesi ${p.sisaSesi} di luar 0..${p.totalSesi}`);

// 7. Pembayaran sukses -> paket tidak menunggu bayar.
const pay = await q(`SELECT pay.id, p.status FROM "Payment" pay JOIN "Package" p ON p.id = pay."packageId" WHERE pay.status='SUCCESS' AND p.status='PENDING_PAYMENT'`);
for (const r of pay) bad("bayar", `payment ${r.id} sukses tapi paket masih menunggu bayar`);

// 8. Platform tidak minus melebihi yang wajar.
const plat = (await q(`SELECT
  (SELECT COALESCE(SUM(amount),0)::int FROM "WalletTransaction" WHERE type='PLATFORM_REVENUE') - (SELECT COALESCE(SUM("revenueAmount"),0)::int FROM "PlatformWithdrawal") AS revenue,
  (SELECT COALESCE(SUM(amount),0)::int FROM "WalletTransaction" WHERE type='PLATFORM_TAX') - (SELECT COALESCE(SUM("taxAmount"),0)::int FROM "PlatformWithdrawal") AS tax`))[0];
notes.push(`platform: pendapatan bersih ${plat.revenue}, PPN ${plat.tax}`);
const pphHeld = (await q(`SELECT COALESCE(-SUM(amount),0)::int AS s FROM "WalletTransaction" WHERE type='PPH_WITHHELD'`))[0].s;
const pphPaid = (await q(`SELECT COALESCE(SUM(amount),0)::int AS s FROM "PphRemittance"`))[0].s;
notes.push(`titipan PPh 0,5% kolam/coach (bukan pendapatan SPH): ${pphHeld}, sudah disetor ${pphPaid}, belum disetor ${pphHeld - pphPaid}`);
if (pphPaid > pphHeld) bad("PPh", `setoran ${pphPaid} melebihi titipan ${pphHeld}`);

// 9. Saldo member = jumlah catatannya, tidak pernah minus.
const mw = await q(`SELECT u.id, u."memberBalance" AS bal, COALESCE(SUM(t.amount),0)::int AS ledger
  FROM "User" u LEFT JOIN "MemberWalletTransaction" t ON t."memberId" = u.id GROUP BY u.id HAVING u."memberBalance" <> 0 OR COUNT(t.id) > 0`);
for (const r of mw) {
  if (r.bal !== r.ledger) bad("saldo member", `${r.id}: tersimpan ${r.bal}, catatan ${r.ledger}`);
  if (r.bal < 0) bad("saldo member", `${r.id}: minus ${r.bal}`);
}
notes.push(`saldo member: ${mw.length} dompet dicek`);
// 10. Paket yang memakai saldo: bayar Midtrans (atau 0) + saldo = harga tersimpan.
const ps = await q(`SELECT p.id, p."saldoUsed" AS saldo, p."poolPrice" + p."coachPrice" + p."serviceFee" AS price,
  (SELECT pay.amount FROM "Payment" pay WHERE pay."packageId" = p.id AND pay.status = 'SUCCESS' AND pay."coachChangeRequestId" IS NULL ORDER BY pay."createdAt" LIMIT 1) AS paid,
  (SELECT COUNT(*) FROM "CoachChangeRequest" c WHERE c."packageId" = p.id AND c.status = 'COMPLETED')::int AS changes
  FROM "Package" p WHERE p."saldoUsed" > 0 AND p.status = 'ACTIVE'`);
for (const r of ps) if (r.changes === 0 && r.paid != null && r.paid + r.saldo !== r.price) bad("saldo member", `paket ${r.id}: bayar ${r.paid} + saldo ${r.saldo} != harga ${r.price}`);
if (plat.tax < 0) bad("platform", `saldo PPN minus ${plat.tax}`);

console.log(notes.join("\n"));
console.log(problems.length ? `\nTIDAK COCOK (${problems.length}):\n` + problems.join("\n") : "\nSemua cocok.");
await db.end();
process.exit(problems.length ? 1 : 0);

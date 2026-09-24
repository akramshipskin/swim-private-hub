import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { splitPlatformTax } from "@/lib/policy";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Laporan komisi platform.
//
// BUG (ditemuin & dibenerin 2026-09-14): versi sebelumnya masih pake
// model LAMA (pre-revisi 2026-09-12) -- komisi dihitung dari
// Payment.amount (harga PAKET PENUH) x commissionPercent KOLAM TEMPAT
// PAKET DIBELI, seolah komisi kepotong otomatis pas checkout. Itu udah
// gak sesuai arsitektur sekarang: wallet baru dikredit PER SESI pas
// attendance ditandai Hadir (lihat src/lib/wallet.ts), pake persentase
// KOLAM TEMPAT SESI ITU BENERAN DIAJAR (booking.availability.poolId),
// bukan kolam pembelian -- paket sekarang bisa dipake lintas-kolam.
// Versi lama itu bisa nunjukin komisi buat paket yang sesinya BELUM
// dipakai sama sekali, dan nyalahin ke kolam yang keliru.
//
// Versi ini ngitung ulang dari booking yang beneran attended=true,
// pake rumus PERSIS SAMA kayak creditSessionRevenue (perSessionValue =
// harga paket / totalSesi), dikelompokin per kolam TEMPAT SESI DIAJAR.
export default async function KomisiPage() {
  await requireRole("ADMIN");

  const [attendedBookings, pools, paidOut, manualPool] = await Promise.all([
    prisma.booking.findMany({
      where: { attended: true },
      select: {
        id: true,
        availability: { select: { poolId: true } },
        package: {
          select: {
            totalSesi: true,
            isSingleSession: true,
            poolId: true,
            payments: { where: { status: "SUCCESS" }, select: { amount: true }, take: 1 },
          },
        },
      },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, commissionPercent: true, coachSharePercent: true, walletBalance: true } }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: "PAID" }, _sum: { amount: true } }),
    // Koreksi manual saldo kolam (baris tanpa sesi, dibuat langsung di DB):
    // tidak masuk tabel sesi di bawah, tapi ikut di "Saldo kolam". Ditampilkan
    // terpisah supaya angka kartu bisa dicocokkan. Hanya dibaca.
    prisma.walletTransaction.groupBy({ by: ["poolId"], where: { type: "SESSION_REVENUE", poolId: { not: null }, bookingId: null }, _sum: { amount: true } }),
  ]);

  // Nominal kolam & coach diambil dari ledger (yang benar-benar dikredit,
  // termasuk koreksi), komisi platform = nilai sesi - bagian kolam - coach.
  const ledger = await prisma.walletTransaction.groupBy({
    by: ["bookingId", "type"],
    where: { bookingId: { in: attendedBookings.map((b) => b.id) }, type: { in: ["SESSION_REVENUE", "SESSION_PAYOUT"] } },
    _sum: { amount: true },
  });
  const credited = (bookingId: string, type: "SESSION_REVENUE" | "SESSION_PAYOUT") =>
    ledger.find((l) => l.bookingId === bookingId && l.type === type)?._sum.amount ?? 0;

  type Part = { sessions: number; gross: number; platform: number; pool: number; coach: number };
  const zero = (): Part => ({ sessions: 0, gross: 0, platform: 0, pool: 0, coach: 0 });
  const byPool = new Map<string, { own: Part; single: Part; legacy: Part; free: number }>();

  for (const b of attendedBookings) {
    const poolId = b.availability.poolId;
    if (!byPool.has(poolId)) byPool.set(poolId, { own: zero(), single: zero(), legacy: zero(), free: 0 });
    const entry = byPool.get(poolId)!;
    const payment = b.package.payments[0];
    if (!payment) {
      entry.free += 1; // paket assign manual/gratis: tidak ada uang
      continue;
    }
    const part = b.package.isSingleSession ? entry.single : b.package.poolId !== poolId ? entry.legacy : entry.own;
    const gross = Math.round(payment.amount / b.package.totalSesi);
    const pool = credited(b.id, "SESSION_REVENUE");
    const coach = credited(b.id, "SESSION_PAYOUT");
    part.sessions += 1;
    part.gross += gross;
    part.pool += pool;
    part.coach += coach;
    part.platform += gross - pool - coach;
  }

  const sum = (parts: Part[], k: keyof Part) => parts.reduce((n, p) => n + p[k], 0);
  const totalPlatform = [...byPool.values()].reduce((n, e) => n + sum([e.own, e.single, e.legacy], "platform"), 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Bagi Hasil</h1>
      <p className="mt-1 text-sm text-text-muted">
        Pembagian uang dari setiap sesi yang ditandai Hadir: komisi platform, komisi kolam, dan komisi coach.
        Sesi yang belum ditandai belum dihitung. Nilai sesi = harga paket ÷ jumlah sesi.
      </p>
      <Card className="mt-4">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-text">Total komisi platform (semua kolam)</p>
          <Link
            href="/admin/withdrawals"
            className="order-3 inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 max-sm:min-h-[44px] sm:order-none"
          >
            Cairkan saldo →
          </Link>
          <p className="text-right text-xl font-bold text-text">
            {formatRupiah(totalPlatform)}
            <span className="block text-sm font-normal text-text-muted">
              bersih {formatRupiah(splitPlatformTax(totalPlatform).net)} · PPN {formatRupiah(splitPlatformTax(totalPlatform).tax)}
            </span>
          </p>
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {pools.map((pool) => {
          const e = byPool.get(pool.id) ?? { own: zero(), single: zero(), legacy: zero(), free: 0 };
          const parts = [
            { label: "Paket kolam ini", p: e.own },
            { label: "Beli 1 sesi", p: e.single },
            ...(e.legacy.sessions > 0 ? [{ label: "Paket kolam lain (sebelum 17 Sep)", p: e.legacy }] : []),
          ];
          const all = [e.own, e.single, e.legacy];
          // Tampilan HP: tabel 7 kolom tidak muat, jadi tiap baris jadi kartu.
          const cards = [
            ...parts.map(({ label, p }) => ({ label, total: false, p })),
            {
              label: "Total",
              total: true,
              p: { sessions: sum(all, "sessions"), gross: sum(all, "gross"), platform: sum(all, "platform"), pool: sum(all, "pool"), coach: sum(all, "coach") },
            },
          ];
          const paid = paidOut.find((x) => x.poolId === pool.id)?._sum.amount ?? 0;
          return (
            <Card key={pool.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-text">{pool.name}</h2>
                    <p className="text-sm text-text-muted">
                      Komisi {pool.commissionPercent}% · coach {pool.coachSharePercent}% · kolam {100 - pool.commissionPercent - pool.coachSharePercent}%
                    </p>
                  </div>
                  <Link href={`/admin/withdrawals?pool=${pool.id}`} className="shrink-0 text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                    Riwayat pencairan &rarr;
                  </Link>
                </div>
                <ul className="flex flex-col gap-2 sm:hidden">
                  {cards.map(({ label, total, p }) => (
                    <li key={label} className={`rounded-lg border border-border px-3 py-2 ${total ? "bg-surface-muted" : ""}`}>
                      <p className={`text-sm text-text ${total ? "font-semibold" : "font-medium"}`}>
                        {label} <span className="font-normal text-text-muted">· {p.sessions} sesi · nilai {formatRupiah(p.gross)}</span>
                      </p>
                      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm tabular-nums">
                        <dt className="text-text-muted">Platform bersih</dt>
                        <dd className="text-right text-text">{formatRupiah(splitPlatformTax(p.platform).net)}</dd>
                        <dt className="text-text-muted">PPN 12%</dt>
                        <dd className="text-right text-text">{formatRupiah(splitPlatformTax(p.platform).tax)}</dd>
                        <dt className="text-text-muted">Kolam</dt>
                        <dd className="text-right text-text">{formatRupiah(p.pool)}</dd>
                        <dt className="text-text-muted">Coach</dt>
                        <dd className="text-right text-text">{formatRupiah(p.coach)}</dd>
                      </dl>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-subtle">
                        <th className="py-1 font-medium">Sumber</th>
                        <th className="py-1 text-right font-medium">Sesi</th>
                        <th className="py-1 text-right font-medium">Nilai</th>
                        <th className="py-1 text-right font-medium">Platform bersih</th>
                        <th className="py-1 text-right font-medium">PPN 12%</th>
                        <th className="py-1 text-right font-medium">Kolam</th>
                        <th className="py-1 text-right font-medium">Coach</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {parts.map(({ label, p }) => (
                        <tr key={label} className="border-t border-border">
                          <td className="py-1.5 text-text">{label}</td>
                          <td className="py-1.5 text-right">{p.sessions}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.gross)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(splitPlatformTax(p.platform).net)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(splitPlatformTax(p.platform).tax)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.pool)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.coach)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border font-semibold">
                        <td className="py-1.5 text-text">Total</td>
                        <td className="py-1.5 text-right">{sum(all, "sessions")}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "gross"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(splitPlatformTax(sum(all, "platform")).net)}</td>
                        <td className="py-1.5 text-right">{formatRupiah(splitPlatformTax(sum(all, "platform")).tax)}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "pool"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "coach"))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {e.free > 0 && <p className="text-xs text-text-subtle">{e.free} sesi dari paket gratis/assign manual (tanpa uang) tidak dihitung.</p>}
                {(() => {
                  const manual = manualPool.find((x) => x.poolId === pool.id)?._sum.amount ?? 0;
                  return manual !== 0 ? (
                    <p className="text-xs text-text-subtle">
                      Koreksi manual saldo kolam (tanpa sesi): {manual < 0 ? "−" : ""}{formatRupiah(Math.abs(manual))} — tidak termasuk tabel di atas, tapi ikut di saldo kolam.
                    </p>
                  ) : null;
                })()}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3">
                  <div>
                    <p className="text-sm text-text-muted">Saldo kolam belum dicairkan</p>
                    <p className="text-lg font-bold text-text">{formatRupiah(pool.walletBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Sudah dicairkan</p>
                    <p className="text-lg font-semibold text-text-muted">{formatRupiah(paid)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

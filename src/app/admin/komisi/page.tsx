import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { AFFILIATE_PAYOUT_NOTE } from "@/lib/affiliate";
import { formatBps } from "@/lib/pricing";
import { todayWibDateString, formatDateWib } from "@/lib/datetime";
import PphRemitForm from "./pph-remit-form";

export const metadata: Metadata = {
  title: "Bagi Hasil | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Laporan komisi platform: dihitung dari booking yang sudah ditandai
// (Hadir/Tidak Hadir), dikelompokkan per kolam TEMPAT SESI DIAJAR
// (booking.availability.poolId). Semua nominal diambil dari buku besar (yang
// benar-benar dikredit), termasuk riwayat paket model bagi hasil persen lama
// yang sudah dihapus (Hadi 2 Okt malam, #9).
export default async function KomisiPage() {
  await requireRole("ADMIN");

  const [attendedBookings, pools, paidOut, manualPool, processing, manualOther, affiliatePaid] = await Promise.all([
    prisma.booking.findMany({
      // Tidak Hadir ikut dihitung sejak 29 Sep: coach dapat 50%, sisanya platform.
      where: { attended: { not: null } },
      select: {
        id: true,
        attended: true,
        availability: { select: { poolId: true } },
        package: {
          select: {
            poolPrice: true,
            payments: { where: { status: "SUCCESS" }, select: { id: true }, take: 1 },
          },
        },
      },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, serviceFeeBps: true, walletBalance: true } }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: "PAID" }, _sum: { amount: true } }),
    // Koreksi manual saldo kolam (baris tanpa sesi, dibuat langsung di DB):
    // tidak masuk tabel sesi di bawah, tapi ikut di "Saldo kolam". Ditampilkan
    // terpisah supaya angka kartu bisa dicocokkan. Hanya dibaca.
    prisma.walletTransaction.groupBy({ by: ["poolId"], where: { type: "SESSION_REVENUE", poolId: { not: null }, bookingId: null }, _sum: { amount: true } }),
    // Penarikan belum selesai: saldo sudah terpotong sejak diajukan.
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amount: true } }),
    // Koreksi manual saldo coach & pendapatan platform (baris tanpa sesi).
    // Tidak masuk hitungan sesi di halaman ini, tapi ikut di saldo mereka.
    prisma.walletTransaction.groupBy({
      by: ["type"],
      where: {
        type: { in: ["SESSION_PAYOUT", "PLATFORM_REVENUE", "PLATFORM_TAX"] },
        bookingId: null,
        // Komisi afiliasi yang dibayar dari SPH bukan koreksi manual: dihitung terpisah di bawah.
        OR: [{ note: null }, { note: { not: AFFILIATE_PAYOUT_NOTE } }],
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "PLATFORM_REVENUE", bookingId: null, note: AFFILIATE_PAYOUT_NOTE },
      _sum: { amount: true },
    }),
  ]);
  const affiliatePaidOut = affiliatePaid._sum.amount ?? 0;
  // Titipan PPh 0,5% dari bagian kolam/coach (paket model harga-dari-coach):
  // uang mereka yang disetor SPH ke kantor pajak, bukan pendapatan SPH.
  const pphHeld = -((await prisma.walletTransaction.aggregate({ where: { type: "PPH_WITHHELD" }, _sum: { amount: true } }))._sum.amount ?? 0);
  const remittances = await prisma.pphRemittance.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  const pphPaid = (await prisma.pphRemittance.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;
  const manualOf = (t: string) => manualOther.find((x) => x.type === t)?._sum.amount ?? 0;
  const manualCoach = manualOf("SESSION_PAYOUT");
  const manualPlatformNet = manualOf("PLATFORM_REVENUE");
  const manualPlatformTax = manualOf("PLATFORM_TAX");
  const signed = (n: number) => `${n < 0 ? "−" : ""}${formatRupiah(Math.abs(n))}`;

  // Nominal kolam & coach diambil dari ledger (yang benar-benar dikredit,
  // termasuk koreksi), komisi platform = nilai sesi - bagian kolam - coach.
  const ledger = await prisma.walletTransaction.groupBy({
    by: ["bookingId", "type"],
    where: { bookingId: { in: attendedBookings.map((b) => b.id) }, type: { in: ["SESSION_REVENUE", "SESSION_PAYOUT", "PLATFORM_REVENUE", "PLATFORM_TAX"] } },
    _sum: { amount: true },
  });
  const credited = (bookingId: string, type: "SESSION_REVENUE" | "SESSION_PAYOUT" | "PLATFORM_REVENUE" | "PLATFORM_TAX") =>
    ledger.find((l) => l.bookingId === bookingId && l.type === type)?._sum.amount ?? 0;

  // tax = PPN yang benar-benar dicatat ledger per sesi. Jangan hitung ulang
  // dari total gabungan: pembulatan sekali di total bisa beda Rp1 dengan
  // jumlah pembulatan per sesi (angka Dashboard & Penarikan pakai ledger).
  type Part = { sessions: number; gross: number; platform: number; tax: number; pool: number; coach: number };
  const zero = (): Part => ({ sessions: 0, gross: 0, platform: 0, tax: 0, pool: 0, coach: 0 });
  type Entry = { paket: Part; legacy: Part; noShow: Part; free: number };
  const emptyEntry = (): Entry => ({ paket: zero(), legacy: zero(), noShow: zero(), free: 0 });
  const byPool = new Map<string, Entry>();

  for (const b of attendedBookings) {
    const poolId = b.availability.poolId;
    if (!byPool.has(poolId)) byPool.set(poolId, emptyEntry());
    const entry = byPool.get(poolId)!;
    if (!b.package.payments[0]) {
      entry.free += 1; // paket pemberian manual admin: tidak ada uang
      continue;
    }
    const part = b.attended === false ? entry.noShow : b.package.poolPrice != null ? entry.paket : entry.legacy;
    const gross =
      credited(b.id, "SESSION_REVENUE") + credited(b.id, "SESSION_PAYOUT") + credited(b.id, "PLATFORM_REVENUE") + credited(b.id, "PLATFORM_TAX");
    const pool = credited(b.id, "SESSION_REVENUE");
    const coach = credited(b.id, "SESSION_PAYOUT");
    part.sessions += 1;
    part.gross += gross;
    part.pool += pool;
    part.coach += coach;
    part.platform += gross - pool - coach;
    part.tax += credited(b.id, "PLATFORM_TAX");
  }

  const sum = (parts: Part[], k: keyof Part) => parts.reduce((n, p) => n + p[k], 0);
  const allParts = [...byPool.values()].flatMap((e) => [e.paket, e.legacy, e.noShow]);
  const totalPlatform = sum(allParts, "platform");
  const totalTax = sum(allParts, "tax");

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Bagi Hasil</h1>
      <p className="mt-1 text-sm text-text-muted">
        Pembagian uang dari setiap sesi yang sudah ditandai: komisi platform, bagian kolam, dan bagian coach. Sesi
        Tidak Hadir (peserta sudah booking tetapi tidak datang): coach mendapat 50% dari bagiannya, kolam tidak mendapat bagian.
        Sesi yang belum ditandai belum dihitung. Kolam dan coach mendapat harga mereka ÷ jumlah sesi (sebelum potongan PPh
        0,5%), sisanya biaya layanan SPH.
      </p>
      <Card className="mt-4">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-text">Total komisi platform (semua kolam)</p>
          <Link
            href="/admin/withdrawals"
            className="order-3 inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 max-lg:min-h-[44px] sm:order-none"
          >
            Cairkan saldo →
          </Link>
          <p className="text-right text-xl font-bold text-text">
            {formatRupiah(totalPlatform)}
            <span className="block text-sm font-normal text-text-muted">
              bersih {formatRupiah(totalPlatform - totalTax)} · PPN {formatRupiah(totalTax)}
            </span>
          </p>
          {(pphHeld !== 0 || pphPaid !== 0) && (
            <div className="order-4 w-full space-y-2 border-t border-border pt-2 text-xs text-text-subtle sm:order-none">
              <p>
                Titipan PPh 0,5% dari bagian kolam &amp; coach (bukan pendapatan SPH, wajib disetor atas nama mereka): {signed(pphHeld)} ·
                sudah disetor {formatRupiah(pphPaid)} · <b className="text-text">belum disetor {signed(pphHeld - pphPaid)}</b>
              </p>
              <p>
                Rekap PPh per mitra (bahan bukti potong, kirim paling lambat tanggal 20 bulan berikutnya):{" "}
                {recapMonths().map((m, i) => (
                  <span key={m}>
                    {i > 0 && " · "}
                    <a href={`/api/admin/pph-rekap?bulan=${m}`} className="-my-3 inline-block py-3 font-medium text-brand-700 hover:underline">
                      Unduh {m}
                    </a>
                  </span>
                ))}
              </p>
              {pphHeld - pphPaid > 0 && <PphRemitForm />}
              {remittances.length > 0 && (
                <ul className="space-y-0.5">
                  {remittances.map((r) => (
                    <li key={r.id}>
                      {formatDateWib(r.createdAt)} · {formatRupiah(r.amount)} · {r.reference}
                      {r.note ? ` · ${r.note}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {affiliatePaidOut !== 0 && (
            <p className="order-4 w-full border-t border-border pt-2 text-xs text-text-subtle sm:order-none">
              Komisi afiliasi yang sudah dibayar dari bagian SPH (ikut mengurangi saldo platform, tidak masuk hitungan di halaman ini): {signed(affiliatePaidOut)}
            </p>
          )}
          {(manualPlatformNet !== 0 || manualPlatformTax !== 0 || manualCoach !== 0) && (
            <div className="order-4 w-full space-y-0.5 border-t border-border pt-2 text-xs text-text-subtle sm:order-none">
              <p className="font-medium text-text-muted">Koreksi manual (dicatat langsung di database, bukan dari sesi). Ikut di saldo, tetapi tidak masuk hitungan di halaman ini:</p>
              {(manualPlatformNet !== 0 || manualPlatformTax !== 0) && (
                <p>Platform: bersih {signed(manualPlatformNet)} · PPN {signed(manualPlatformTax)}</p>
              )}
              {manualCoach !== 0 && <p>Semua coach: {signed(manualCoach)}</p>}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 min-[1800px]:grid-cols-2">
        {pools.map((pool) => {
          const e = byPool.get(pool.id) ?? emptyEntry();
          const parts = [
            { label: "Paket", p: e.paket },
            ...(e.legacy.sessions > 0 ? [{ label: "Riwayat Paket Model Lama", p: e.legacy }] : []),
            ...(e.noShow.sessions > 0 ? [{ label: "Tidak Hadir", p: e.noShow }] : []),
          ];
          const all = [e.paket, e.legacy, e.noShow];
          // Tampilan HP: tabel 7 kolom tidak muat, jadi tiap baris jadi kartu.
          const cards = [
            ...parts.map(({ label, p }) => ({ label, total: false, p })),
            {
              label: "Total",
              total: true,
              p: { sessions: sum(all, "sessions"), gross: sum(all, "gross"), platform: sum(all, "platform"), tax: sum(all, "tax"), pool: sum(all, "pool"), coach: sum(all, "coach") },
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
                      Biaya layanan {formatBps(pool.serviceFeeBps)}
                    </p>
                  </div>
                  <Link href={`/admin/withdrawals?pool=${pool.id}`} className="shrink-0 text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                    Riwayat penarikan &rarr;
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
                        <dd className="text-right text-text">{formatRupiah(p.platform - p.tax)}</dd>
                        <dt className="text-text-muted">PPN</dt>
                        <dd className="text-right text-text">{formatRupiah(p.tax)}</dd>
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
                        <th className="py-1 text-right font-medium">PPN</th>
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
                          <td className="py-1.5 text-right">{formatRupiah(p.platform - p.tax)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.tax)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.pool)}</td>
                          <td className="py-1.5 text-right">{formatRupiah(p.coach)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border font-semibold">
                        <td className="py-1.5 text-text">Total</td>
                        <td className="py-1.5 text-right">{sum(all, "sessions")}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "gross"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "platform") - sum(all, "tax"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "tax"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "pool"))}</td>
                        <td className="py-1.5 text-right">{formatRupiah(sum(all, "coach"))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {e.free > 0 && <p className="text-xs text-text-subtle">{e.free} sesi dari paket pemberian manual admin (tanpa uang) tidak dihitung.</p>}
                {(() => {
                  const manual = manualPool.find((x) => x.poolId === pool.id)?._sum.amount ?? 0;
                  return manual !== 0 ? (
                    <p className="text-xs text-text-subtle">
                      Koreksi manual saldo kolam (tanpa sesi): {manual < 0 ? "−" : ""}{formatRupiah(Math.abs(manual))}. Tidak termasuk tabel di atas, tetapi ikut di saldo kolam.
                    </p>
                  ) : null;
                })()}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3">
                  <div>
                    <p className="text-sm text-text-muted">Saldo kolam belum ditarik</p>
                    <p className="text-lg font-bold text-text">{formatRupiah(pool.walletBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Sudah ditarik</p>
                    <p className="text-lg font-semibold text-text-muted">{formatRupiah(paid)}</p>
                  </div>
                  {(() => {
                    const inProgress = processing.find((x) => x.poolId === pool.id)?._sum.amount ?? 0;
                    return inProgress > 0 ? (
                      <div className="col-span-2">
                        <p className="text-sm text-text-muted">Penarikan sedang diproses</p>
                        <p className="text-lg font-semibold text-text-muted">{formatRupiah(inProgress)}</p>
                        <p className="text-xs text-text-subtle">Sudah dipotong dari saldo di atas; kembali kalau ditolak.</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

// Bulan lalu dan bulan ini (WIB), format YYYY-MM, untuk tautan unduh rekap PPh.
function recapMonths(): string[] {
  const [y, m] = todayWibDateString().split("-").map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  return [prev, `${y}-${String(m).padStart(2, "0")}`];
}

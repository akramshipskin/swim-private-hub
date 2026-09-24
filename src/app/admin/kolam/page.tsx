import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { dateLabel, todayWibDateString } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PoolShareForm from "./pool-share-form";
import AffiliateCoachForm from "./affiliate-coach-form";
import PoolActiveToggle from "./pool-active-toggle";
import PoolInfoForm from "@/components/pool-info-form";
import { PoolPhotosForm } from "@/components/pool-photos-form";
import { isStorageConfigured } from "@/lib/storage";

export default async function AdminKolamPage() {
  await requireRole("ADMIN");

  const [pools, coaches] = await Promise.all([
    prisma.pool.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        commissionPercent: true,
        coachSharePercent: true,
        walletBalance: true,
        description: true,
        address: true,
        contactPhone: true,
        openTime: true,
        closeTime: true,
        facilities: true,
        photos: true,
        ownerships: {
          select: { owner: { select: { name: true, phone: true } } },
          orderBy: { createdAt: "asc" },
        },
        packageTemplates: {
          orderBy: { totalSesi: "asc" },
          select: { id: true, name: true, price: true, totalSesi: true, durationDays: true, isActive: true },
        },
        affiliations: {
          select: { id: true, coachId: true, coach: { select: { name: true, coachProfile: { select: { photoUrl: true } } } } },
          orderBy: { coach: { name: "asc" } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "COACH" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Rincian asal saldo per kolam: pendapatan sesi dipisah menurut jenis paket
  // yang dipakai (paket kolam ini / beli 1 sesi / paket kolam lain dari masa
  // lintas-kolam sebelum 17 Sep 2026), lalu dikurangi pencairan.
  const [revenueTxns, paidOut, processing] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { type: "SESSION_REVENUE", poolId: { not: null } },
      select: { poolId: true, amount: true, bookingId: true },
    }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: "PAID" }, _sum: { amount: true } }),
    // Pencairan yang belum selesai: saldo SUDAH dipotong sejak diajukan (dan
    // balik lagi kalau ditolak/gagal), jadi harus muncul di rincian supaya
    // jumlahnya cocok dengan saldo.
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amount: true } }),
  ]);
  // Booking mendatang yang masih jalan di kolam nonaktif (kolam dinonaktifkan
  // setelah member booking): tetap berlaku, admin perlu menghubungi member.
  const stuckBookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { pool: { isActive: false }, date: { gte: dateLabel(todayWibDateString()) } },
    },
    select: { availability: { select: { poolId: true } } },
  });
  const stuckByPool = new Map<string, number>();
  for (const b of stuckBookings) {
    stuckByPool.set(b.availability.poolId, (stuckByPool.get(b.availability.poolId) ?? 0) + 1);
  }
  const bookingIds = [...new Set(revenueTxns.map((t) => t.bookingId).filter((id): id is string => !!id))];
  const bookingPkgs = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, package: { select: { poolId: true, isSingleSession: true } } },
  });
  const pkgByBooking = new Map(bookingPkgs.map((b) => [b.id, b.package]));
  // Baris tanpa sesi (bookingId kosong / sesinya tidak ada lagi) = koreksi
  // manual langsung di DB -- aplikasi sendiri selalu mencatat bookingId.
  // Dulu ikut masuk "Dari paket kolam ini" dan membingungkan; sekarang baris
  // tersendiri. Hanya pelabelan: jumlah semua baris tetap sama.
  function revenueBreakdown(poolId: string) {
    const out = { own: 0, single: 0, legacy: 0, manual: 0 };
    for (const t of revenueTxns) {
      if (t.poolId !== poolId) continue;
      const pkg = t.bookingId ? pkgByBooking.get(t.bookingId) : undefined;
      if (!pkg) out.manual += t.amount;
      else if (pkg.isSingleSession) out.single += t.amount;
      else if (pkg.poolId !== poolId) out.legacy += t.amount;
      else out.own += t.amount;
    }
    return out;
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Kelola Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">
        Persentase pembagian per kolam — bisa diubah kapan saja, tidak butuh migrasi. Sisanya
        (100% - komisi platform - komisi coach) otomatis jadi komisi kolam.
      </p>

      {pools.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">
            Belum ada kolam. Jalankan <code>npm run onboard:pools</code>.
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {pools.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-col gap-4 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-text">{p.name}</h2>
                      <Badge tone={p.isActive ? "success" : "warning"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge>
                    </div>
                    <p className="text-sm text-text-muted">{p.address ?? "Alamat belum diisi"}</p>
                    <p className="text-sm text-text-muted">
                      Pemilik: {p.ownerships.length === 0 ? "belum ada" : p.ownerships.map((o) => `${o.owner.name}${o.owner.phone ? ` (${o.owner.phone})` : ""}`).join(", ")}
                    </p>
                  </div>
                  <PoolActiveToggle poolId={p.id} poolName={p.name} isActive={p.isActive} />
                </div>

                {(stuckByPool.get(p.id) ?? 0) > 0 && (
                  <div className="rounded-xl border border-warning-text/15 bg-warning-bg p-3 text-sm text-warning-text">
                    <strong>{stuckByPool.get(p.id)} booking mendatang</strong> masih terjadwal di kolam nonaktif ini.
                    Sesi tetap berlaku — hubungi member, lalu batalkan lewat{" "}
                    <a href="/admin/booking-overview" className="underline">Booking Overview</a> kalau kolam tidak bisa melayani.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl bg-surface-muted p-3">
                    <p className="text-sm font-semibold text-text">Harga paket</p>
                    {p.packageTemplates.length === 0 ? (
                      <p className="text-sm text-warning-text">Belum ada paket di katalog.</p>
                    ) : (
                      <ul className="mt-1 flex flex-col gap-1">
                        {p.packageTemplates.map((t) => (
                          <li key={t.id} className="flex justify-between gap-2 text-sm">
                            <span className={t.isActive ? "text-text" : "text-text-subtle line-through"}>
                              {t.name} · {t.totalSesi} sesi · {t.durationDays} hari
                            </span>
                            <span className="font-semibold text-text">{formatRupiah(t.price)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {(() => {
                    const r = revenueBreakdown(p.id);
                    const paid = paidOut.find((x) => x.poolId === p.id)?._sum.amount ?? 0;
                    const inProgress = processing.find((x) => x.poolId === p.id)?._sum.amount ?? 0;
                    return (
                      <div className="rounded-xl bg-surface-muted p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-text">Saldo kolam (bisa dicairkan)</p>
                          <p className="text-lg font-bold text-text">{formatRupiah(p.walletBalance)}</p>
                        </div>
                        <p className="text-xs text-text-subtle">Komisi kolam dari tiap sesi yang ditandai Hadir, dikurangi pencairan.</p>
                        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm">
                          <dt className="text-text-muted">Dari paket kolam ini</dt><dd className="text-right text-text">{formatRupiah(r.own)}</dd>
                          <dt className="text-text-muted">Dari beli 1 sesi (member kolam lain)</dt><dd className="text-right text-text">{formatRupiah(r.single)}</dd>
                          {r.legacy > 0 && (<><dt className="text-text-muted">Paket kolam lain (sebelum 17 Sep)</dt><dd className="text-right text-text">{formatRupiah(r.legacy)}</dd></>)}
                          {r.manual !== 0 && (<><dt className="text-text-muted">Koreksi manual (tanpa sesi)</dt><dd className="text-right text-text">{r.manual < 0 ? "−" : ""}{formatRupiah(Math.abs(r.manual))}</dd></>)}
                          <dt className="text-text-muted">Sudah dicairkan</dt><dd className="text-right text-text">−{formatRupiah(paid)}</dd>
                          {inProgress > 0 && (<><dt className="text-text-muted">Pencairan sedang diproses</dt><dd className="text-right text-text">−{formatRupiah(inProgress)}</dd></>)}
                        </dl>
                      </div>
                    );
                  })()}
                  <div className="rounded-xl bg-surface-muted p-3">
                    <p className="mb-2 text-sm font-semibold text-text">Pembagian komisi</p>
                    <PoolShareForm
                      poolId={p.id}
                      commissionPercent={p.commissionPercent}
                      coachSharePercent={p.coachSharePercent}
                    />
                  </div>
                </div>
                <details className="rounded-lg border border-border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium text-text max-sm:py-3">
                    Info &amp; fasilitas kolam ({p.facilities.length} fasilitas)
                  </summary>
                  <div className="mt-3 flex flex-col gap-6">
                    <PoolInfoForm pool={p} />
                    <div className="border-t border-border pt-4">
                      <h4 className="mb-2 text-sm font-semibold text-text">Foto kolam &amp; fasilitas</h4>
                      <PoolPhotosForm poolId={p.id} photos={p.photos} storageReady={isStorageConfigured()} />
                    </div>
                  </div>
                </details>
                <AffiliateCoachForm
                  poolId={p.id}
                  allCoaches={coaches}
                  affiliations={p.affiliations.map((a) => ({
                    id: a.id,
                    coachId: a.coachId,
                    coachName: a.coach.name,
                    photoUrl: a.coach.coachProfile?.photoUrl ?? null,
                  }))}
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

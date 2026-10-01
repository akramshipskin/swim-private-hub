import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CheckoutButton from "./checkout-button";
import { trialBlockingPackageWhere } from "@/lib/trial";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from "@/lib/datetime";
import { formatRupiah } from "@/lib/format";
import { formatBps, pack8SavingPercent, packQuote, trialQuote } from "@/lib/pricing";

const statusTone = {
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
} as const;

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
};

function toDateLabelFromDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

// Batas waktu bayar Midtrans (24 jam). Dipakai untuk menyembunyikan paket
// yang menunggu pembayaran tapi sudah tidak bisa dibayar lagi.
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const metadata = { title: "Paket Saya | Swim Private Hub" };

export default async function MemberPaketPage() {
  const session = await requireRole("MEMBER");
  const now = new Date();
  const paymentCutoff = new Date(now.getTime() - PAYMENT_WINDOW_MS);

  const [packages, pools, children] = await Promise.all([
    prisma.package.findMany({
      where: {
        memberId: session.user.id,
        // Paket yang menunggu pembayaran tapi sudah lewat batas waktu bayar
        // (24 jam, sama dengan kedaluwarsa transaksi Midtrans) disembunyikan
        // dari daftar -- riwayatnya tetap ada di menu Riwayat Bayar.
        OR: [
          { status: { not: "PENDING_PAYMENT" } },
          { status: "PENDING_PAYMENT", createdAt: { gte: paymentCutoff } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        dependent: { select: { name: true, isSelf: true } },
        pool: { select: { id: true, name: true } },
        // Link bayar Midtrans terakhir yang masih menunggu (tombol "Lanjut bayar").
        payments: { where: { status: "PENDING", snapRedirectUrl: { not: null } }, orderBy: { createdAt: "desc" }, take: 1, select: { snapRedirectUrl: true } },
      },
    }),
    // Model harga-dari-coach (Hadi 2 Okt): kolam aktif + coach yang mengajar
    // di sana. Harga paket = harga kolam + harga coach + biaya layanan SPH.
    prisma.pool.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        description: true,
        facilities: true,
        photos: true,
        openTime: true,
        closeTime: true,
        pricePack4: true,
        pricePack8: true,
        serviceFeeBps: true,
        affiliations: {
          where: { coach: { role: "COACH", isActive: true, coachProfile: { isActive: true } } },
          orderBy: { coach: { name: "asc" } },
          select: {
            coach: { select: { id: true, name: true, coachProfile: { select: { pricePack4: true, pricePack8: true, specialties: true } } } },
          },
        },
      },
    }),
    prisma.dependent.findMany({
      where: { memberId: session.user.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { packages: { where: trialBlockingPackageWhere(now) } } } },
    }),
  ]);
  // Peserta yang masih boleh beli trial (belum pernah punya paket).
  const trialChildren = children.filter((c) => c._count.packages === 0);

  // Kombinasi kolam + coach yang bisa dibeli (keduanya sudah memasang harga).
  const offers = pools
    .map((pool) => ({
      pool,
      coaches: pool.affiliations
        .map(({ coach }) => {
          const prices = coach.coachProfile!;
          const four = packQuote(pool, prices, 4);
          const eight = packQuote(pool, prices, 8);
          return { coach, four, eight, trial: trialQuote(pool, prices), saving: four && eight ? pack8SavingPercent(four, eight) : 0 };
        })
        .filter((c) => c.four || c.eight),
    }))
    .filter((o) => o.coaches.length > 0);

  // "Member" cuma valid begitu paket pernah aktif (beli/diassign) --
  // sebelum itu dia masih pengunjung biasa, jangan diklaim member.
  const everActivated = packages.filter((p) => p.startDate);
  const activePkg = packages.find((p) => p.status === "ACTIVE");
  const earliestStart = everActivated.length
    ? everActivated.reduce((min, p) => (p.startDate! < min ? p.startDate! : min), everActivated[0].startDate!)
    : null;
  const expiredWithDate = packages.filter((p) => p.status === "EXPIRED" && p.expiredDate);
  const latestExpired = expiredWithDate.length
    ? expiredWithDate.reduce((max, p) => (p.expiredDate! > max ? p.expiredDate! : max), expiredWithDate[0].expiredDate!)
    : null;

  const membershipBadge = activePkg && earliestStart ? (
    <Badge tone="success">Member sejak {toDateLabelFromDate(earliestStart)}</Badge>
  ) : latestExpired ? (
    <Badge tone="neutral">Paket habis sejak {toDateLabelFromDate(latestExpired)}</Badge>
  ) : (
    <Badge tone="neutral">Belum ada paket</Badge>
  );

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Paket Saya</h1>
        {membershipBadge}
      </div>

      {packages.length === 0 ? (
        <Card className="mb-8">
          <CardBody className="py-8 text-center">
            <p className="text-sm text-text-muted">Belum ada paket. Pilih salah satu di bawah.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...new Map(packages.map((p) => [p.pool.id, p.pool])).values()].map((pool) => (
            <Card key={pool.id}>
              <CardBody>
                <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">Kolam</p>
                <h2 className="text-lg font-semibold text-brand-700">{pool.name}</h2>
                <ul className="mt-3 flex flex-col divide-y divide-border">
                  {packages
                    .filter((p) => p.pool.id === pool.id)
                    .map((p) => {
                      const used = p.status === "ACTIVE" && p.sisaSesi <= 0;
                      const expired = p.status === "ACTIVE" && p.expiredDate && p.expiredDate < now;
                      return (
                        <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-text">
                              {p.dependent.isSelf ? "Kamu sendiri" : p.dependent.name}
                            </p>
                            <p className="text-sm text-text">{p.name}</p>
                            <p className="text-sm text-text-muted">
                              Sisa <b className="text-text">{p.sisaSesi}</b> dari {p.totalSesi} sesi
                              {p.expiredDate && <> · berlaku s.d. {formatDateLabel(p.expiredDate)}</>}
                            </p>
                          </div>
                          {used ? (
                            <Badge tone="neutral">Sesi habis</Badge>
                          ) : expired ? (
                            <Badge tone="neutral">Kedaluwarsa</Badge>
                          ) : p.status === "PENDING_PAYMENT" && p.payments[0]?.snapRedirectUrl ? (
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                              <a
                                href={p.payments[0].snapRedirectUrl}
                                className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-fixed-ink-deep"
                              >
                                Lanjut bayar
                              </a>
                            </div>
                          ) : (
                            <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-1 text-xl font-semibold text-text">Beli Paket Baru</h2>
      <p className="mb-4 text-sm text-text-muted">
        Pilih kolam, lalu coach. Paket berlaku untuk coach dan kolam yang kamu pilih. Harga sudah termasuk tiket masuk
        untuk 1 peserta, 1 pendamping, dan coach-nya, plus biaya layanan SPH di bawah 7%.
      </p>
      {children.length === 0 ? (
        <p className="text-sm text-text-muted">
          Belum ada peserta terdaftar. Tambah peserta dulu di menu{" "}
          <a href="/member/peserta" className="font-medium text-brand-700 underline">Peserta</a> sebelum beli paket.
        </p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada paket yang bisa dibeli. Kolam dan coach sedang menyiapkan harganya.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map(({ pool, coaches }) => (
            <Card key={pool.id}>
              <CardBody className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {pool.photos.length > 0 && (
                    <div className="flex gap-2 sm:w-56 sm:shrink-0">
                      {pool.photos.slice(0, 2).map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url + i} src={url} alt={`Foto ${pool.name}`} className="h-24 min-w-0 flex-1 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">Kolam</p>
                    <h2 className="text-lg font-semibold text-brand-700">{pool.name}</h2>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {[pool.address, pool.openTime && pool.closeTime && `Buka ${pool.openTime}–${pool.closeTime}`]
                        .filter(Boolean)
                        .join(" · ") || "Info kolam belum dilengkapi"}
                    </p>
                    {pool.description && <p className="mt-1 text-sm text-text-muted">{pool.description}</p>}
                    {pool.facilities.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {pool.facilities.map((f) => (
                          <li key={f} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-text-muted">
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <ul className="flex flex-col gap-3">
                  {coaches.map(({ coach, four, eight, trial, saving }) => (
                    <li key={coach.id} className="rounded-xl border border-border bg-surface-muted p-4">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">Coach</p>
                          <h3 className="text-base font-semibold text-text">{coach.name}</h3>
                          {coach.coachProfile!.specialties.length > 0 && (
                            <p className="text-sm text-text-muted">{coach.coachProfile!.specialties.join(" · ")}</p>
                          )}
                        </div>
                        <a href={`/pelatih/${coach.id}`} className="text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                          Lihat profil coach
                        </a>
                      </div>
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          ...(eight ? [{ q: eight, label: "Paket 8 sesi", note: saving > 0 ? `Hemat ${saving}% per sesi dibanding paket 4` : null }] : []),
                          ...(four ? [{ q: four, label: "Paket 4 sesi", note: null }] : []),
                          ...(trial && trialChildren.length > 0 ? [{ q: trial, label: "Sesi coba", note: "Sekali per peserta yang belum pernah punya paket. Tidak bisa dibatalkan sendiri; tidak hadir = hangus." }] : []),
                        ].map(({ q, label, note }) => (
                          <li key={label} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-base font-semibold leading-snug text-text">{label}</h4>
                              {q.isTrial ? (
                                <Badge tone="accent" className="shrink-0">Coba</Badge>
                              ) : (
                                q.totalSesi === 8 && saving > 0 && <Badge tone="accent" className="shrink-0">Lebih hemat</Badge>
                              )}
                            </div>
                            <div>
                              <p className="text-2xl font-bold leading-tight text-text">{formatRupiah(q.total)}</p>
                              {q.totalSesi > 1 && (
                                <p className="text-sm text-text-muted">{formatRupiah(Math.round(q.total / q.totalSesi))} per sesi</p>
                              )}
                            </div>
                            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm tabular-nums">
                              <dt className="text-text-muted">Kolam</dt>
                              <dd className="text-right text-text">{formatRupiah(q.poolPrice)}</dd>
                              <dt className="text-text-muted">Coach</dt>
                              <dd className="text-right text-text">{formatRupiah(q.coachPrice)}</dd>
                              <dt className="text-text-muted">Biaya layanan SPH ({formatBps(pool.serviceFeeBps)})</dt>
                              <dd className="text-right text-text">{formatRupiah(q.serviceFee)}</dd>
                            </dl>
                            <ul className="flex flex-wrap gap-1.5">
                              <li><Badge tone="brand">{q.totalSesi} sesi les</Badge></li>
                              <li><Badge tone="neutral">Berlaku {q.durationDays} hari</Badge></li>
                              <li><Badge tone="neutral">{q.jatahCancel > 0 ? `Jatah batal ${q.jatahCancel}×` : "Tidak bisa dibatalkan"}</Badge></li>
                            </ul>
                            <div className="mt-auto pt-1">
                              {note && <p className="mb-2 text-xs text-text-muted">{note}</p>}
                              <CheckoutButton poolId={pool.id} coachId={coach.id} sesi={q.totalSesi} dependents={q.isTrial ? trialChildren : children} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

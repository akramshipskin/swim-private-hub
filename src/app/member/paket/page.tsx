import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CheckoutButton from "./checkout-button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from "@/lib/datetime";
import { formatRupiah } from "@/lib/format";

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

export default async function MemberPaketPage() {
  const session = await requireRole("MEMBER");
  const now = new Date();
  const paymentCutoff = new Date(now.getTime() - PAYMENT_WINDOW_MS);

  const [packages, templates, children] = await Promise.all([
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
      },
    }),
    prisma.packageTemplate.findMany({
      // Kolam yang dinonaktifin admin (atau belum di-approve) gak boleh
      // jualan paket lagi.
      where: { isActive: true, pool: { isActive: true } },
      orderBy: { totalSesi: "asc" },
      include: {
        pool: { select: { id: true, name: true, address: true, description: true, facilities: true, photos: true, openTime: true, closeTime: true } },
        // Paket yang pernah aktif (startDate keisi = dibayar/diassign) --
        // dasar badge "Populer", bukan urutan kartu.
        _count: { select: { packages: { where: { startDate: { not: null } } } } },
      },
    }),
    prisma.dependent.findMany({
      where: { memberId: session.user.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const maxSold = Math.max(0, ...templates.map((t) => t._count.packages));
  // Seri = gak ada yang beneran paling laku, jangan pilih salah satu asal.
  const topSellers = templates.filter((t) => t._count.packages === maxSold);
  const popularTemplateId = maxSold > 0 && topSellers.length === 1 ? topSellers[0].id : undefined;

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
        Paket hanya bisa dipakai booking di kolam tempat paket itu dibeli. Pilih kolam yang paling sering kamu datangi.
      </p>
      {children.length === 0 ? (
        <p className="text-sm text-text-muted">
          Belum ada peserta terdaftar. Tambah peserta dulu di menu{" "}
          <a href="/member/peserta" className="font-medium text-brand-700 underline">Peserta</a> sebelum beli paket.
        </p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada katalog paket tersedia.</p>
      ) : (
        // Tiap kolam dibungkus SATU Card (pola yang sama dengan bagian
        // "Paket Saya" di atas dan halaman lain). Sebelumnya header kolam
        // cuma dipisah garis border-b memanjang, jadi ambigu: garisnya
        // kebaca sebagai pemisah antar blok, padahal paket di bawahnya
        // punya kolam di atasnya (Hadi 18 Sep v3).
        <div className="flex flex-col gap-4">
          {[...new Map(templates.map((t) => [t.pool.id, t.pool])).values()].map((pool) => (
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

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {templates
                    .filter((t) => t.pool.id === pool.id)
                    .map((t) => (
                      <li
                        key={t.id}
                        className={
                          t.id === popularTemplateId
                            ? "flex flex-col gap-3 rounded-xl border border-brand-500 bg-surface-muted p-4 ring-1 ring-brand-500"
                            : "flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4"
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-semibold leading-snug text-text">{t.name}</h4>
                          {t.id === popularTemplateId && (
                            <Badge tone="accent" className="shrink-0">Populer</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-2xl font-bold leading-tight text-text">{formatRupiah(t.price)}</p>
                          <p className="text-sm text-text-muted">{formatRupiah(Math.round(t.price / t.totalSesi))} per sesi</p>
                        </div>
                        <ul className="flex flex-wrap gap-1.5">
                          <li><Badge tone="brand">{t.totalSesi} sesi les</Badge></li>
                          <li><Badge tone="neutral">Berlaku {t.durationDays} hari</Badge></li>
                          <li><Badge tone="neutral">Jatah batal {t.jatahCancel}×</Badge></li>
                        </ul>
                        <div className="mt-auto pt-1">
                          <CheckoutButton templateId={t.id} dependents={children} />
                        </div>
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

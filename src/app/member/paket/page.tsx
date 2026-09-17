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

export default async function MemberPaketPage() {
  const session = await requireRole("MEMBER");

  const [packages, templates, children] = await Promise.all([
    prisma.package.findMany({
      where: { memberId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        dependent: { select: { name: true, isSelf: true } },
        pool: { select: { name: true } },
      },
    }),
    prisma.packageTemplate.findMany({
      // Kolam yang dinonaktifin admin (atau belum di-approve) gak boleh
      // jualan paket lagi.
      where: { isActive: true, pool: { isActive: true } },
      orderBy: { totalSesi: "asc" },
      include: {
        pool: { select: { name: true } },
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

  const now = new Date();
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
    <Badge tone="neutral">Paket abis sejak {toDateLabelFromDate(latestExpired)}</Badge>
  ) : (
    <Badge tone="neutral">Belum ada paket</Badge>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
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
        <ul className="mb-8 flex flex-col gap-2">
          {packages.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-text">{p.name}</p>
                  <p className="text-xs text-text-subtle">
                    buat {p.dependent.isSelf ? "kamu sendiri" : p.dependent.name} · {p.pool.name}
                  </p>
                  <p className="text-sm text-text-muted">
                    Sisa sesi {p.sisaSesi}/{p.totalSesi}
                    {p.expiredDate && (
                      <> · Berlaku sampai {formatDateLabel(p.expiredDate)}</>
                    )}
                  </p>
                </div>
                {/* Status di DB bisa tetep ACTIVE walau sesinya abis / udah lewat
                    masa berlaku (gak ada cron yang nge-flip) -- dulu kebaca
                    "Aktif" padahal di halaman Booking paket ini udah gak muncul. */}
                {p.status === "ACTIVE" && p.sisaSesi <= 0 ? (
                  <Badge tone="neutral">Sesi habis</Badge>
                ) : p.status === "ACTIVE" && p.expiredDate && p.expiredDate < now ? (
                  <Badge tone="neutral">Kedaluwarsa</Badge>
                ) : (
                  <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </ul>
      )}

      <h2 className="mb-1 text-lg font-semibold text-text">Beli Paket Baru</h2>
      <p className="mb-3 text-sm text-text-muted">
        Paket cuma bisa dipake booking di kolam tempat paket itu dibeli.
      </p>
      {children.length === 0 ? (
        <p className="text-sm text-text-muted">
          Belum ada anak terdaftar. Tambah anak dulu di halaman{" "}
          <a href="/profil" className="font-medium text-brand-600 underline">
            Profil
          </a>{" "}
          sebelum beli paket.
        </p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada katalog paket tersedia.</p>
      ) : (
        <ul className="flex flex-wrap justify-center gap-3">
          {templates.map((t) => (
            <Card
              key={t.id}
              className={`w-full sm:w-72 ${t.id === popularTemplateId ? "border-brand-500 ring-1 ring-brand-500" : ""}`}
            >
              <CardBody className="flex flex-col items-center gap-3 text-center">
                <div>
                  {t.id === popularTemplateId && (
                    <span className="mb-1 inline-block rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                      Populer
                    </span>
                  )}
                  <p className="font-medium text-text">{t.name}</p>
                  <p className="text-xs text-text-subtle">{t.pool.name}</p>
                  <p className="text-lg font-semibold text-text">{formatRupiah(t.price)}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {t.totalSesi} Sesi · Berlaku {t.durationDays} Hari · Jatah Batal Booking {t.jatahCancel}x
                  </p>
                </div>
                <CheckoutButton templateId={t.id} dependents={children} />
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </main>
  );
}

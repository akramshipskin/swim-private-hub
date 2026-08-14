import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CheckoutButton from "./checkout-button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from "@/lib/datetime";

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

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

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

  const [me, packages, templates] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
    prisma.package.findMany({
      where: { memberId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.packageTemplate.findMany({
      where: { isActive: true },
      orderBy: { totalSesi: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Paket Saya</h1>
        <Badge tone="neutral">Member sejak {toDateLabelFromDate(me.createdAt)}</Badge>
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
                  <p className="text-sm text-text-muted">
                    Sisa sesi {p.sisaSesi}/{p.totalSesi}
                    {p.expiredDate && (
                      <> · Berlaku sampai {formatDateLabel(p.expiredDate)}</>
                    )}
                  </p>
                </div>
                <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
              </CardBody>
            </Card>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-semibold text-text">Beli Paket Baru</h2>
      {templates.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada katalog paket tersedia.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-3">
          {templates.map((t, i) => (
            <Card
              key={t.id}
              className={i === 1 ? "border-brand-500 ring-1 ring-brand-500" : undefined}
            >
              <CardBody className="flex flex-col gap-3">
                <div>
                  {i === 1 && (
                    <span className="mb-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Populer
                    </span>
                  )}
                  <p className="font-medium text-text">{t.name}</p>
                  <p className="text-lg font-semibold text-text">{formatRupiah(t.price)}</p>
                </div>
                <CheckoutButton templateId={t.id} />
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </main>
  );
}

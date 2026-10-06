import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { releaseDueCommissions } from "@/lib/affiliate";

export const metadata = { title: "Afiliasi | Swim Private Hub" };

const STATUS = {
  WAITING: { label: "Menunggu Sesi Hadir", tone: "neutral" },
  PENDING: { label: "Masa Tahan", tone: "warning" },
  RELEASED: { label: "Sudah Cair ke Saldo", tone: "success" },
} as const;

const date = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

// Semua komisi afiliasi (dibayar dari bagian SPH). Membuka halaman ini juga
// mencairkan komisi yang sudah lewat masa tahan.
export default async function AdminAfiliasiPage() {
  await requireRole("ADMIN");
  await releaseDueCommissions();
  const [rows, totals, referred] = await Promise.all([
    prisma.affiliateCommission.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        status: true,
        releaseAt: true,
        releasedAt: true,
        member: { select: { name: true } },
        coachProfile: { select: { user: { select: { name: true } } } },
        pool: { select: { name: true } },
      },
    }),
    prisma.affiliateCommission.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
    prisma.user.count({ where: { referralCodeId: { not: null } } }),
  ]);
  const total = (s: keyof typeof STATUS) => totals.find((t) => t.status === s)?._sum.amount ?? 0;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Afiliasi</h1>
      <p className="mt-1 text-sm text-text-muted">
        {referred} member mendaftar dengan kode afiliasi. Sudah cair {formatRupiah(total("RELEASED"))} · masa tahan{" "}
        {formatRupiah(total("PENDING"))}. Komisi dibayar dari pendapatan SPH.
      </p>
      <Card className="mt-6">
        <CardBody>
          {rows.length === 0 ? (
            <p className="text-sm text-text-muted">Belum ada komisi.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-text">
                      {r.coachProfile ? `Coach ${r.coachProfile.user.name}` : r.pool?.name} · {formatRupiah(r.amount)}
                    </p>
                    <p className="text-xs text-text-subtle">
                      Member {r.member.name}
                      {r.status === "PENDING" && r.releaseAt ? ` · cair ${date(r.releaseAt)}` : ""}
                      {r.releasedAt ? ` · cair ${date(r.releasedAt)}` : ""}
                    </p>
                  </div>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </main>
  );
}

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { releaseDueCommissions } from "@/lib/affiliate";
import { ShowMoreLink, listHref, pageSize } from "@/components/show-more-link";

export const metadata = { title: "Afiliasi | Swim Private Hub" };

const STATUS = {
  WAITING: { label: "Menunggu Sesi Hadir", tone: "neutral" },
  PENDING: { label: "Masa Tahan", tone: "warning" },
  RELEASED: { label: "Sudah Cair ke Saldo", tone: "success" },
  VOID: { label: "Dibatalkan (Dana Dikembalikan)", tone: "danger" },
} as const;

const STEP = 20;

const date = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

// Semua komisi afiliasi (dibayar dari bagian SPH). Membuka halaman ini juga
// menarik komisi yang sudah lewat masa tahan. Ringkasan per penerima di atas,
// rincian per member di bawahnya dengan Tampilkan Lebih Banyak (Hadi 12 Okt,
// penilaian UI/UX: dulu 100 baris berderet tanpa ringkasan).
export default async function AdminAfiliasiPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  await requireRole("ADMIN");
  await releaseDueCommissions();
  const n = pageSize((await searchParams).n, STEP);
  const [rows, count, totals, byRecipient, referred] = await Promise.all([
    prisma.affiliateCommission.findMany({
      orderBy: { createdAt: "desc" },
      take: n,
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
    prisma.affiliateCommission.count(),
    prisma.affiliateCommission.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
    prisma.affiliateCommission.groupBy({ by: ["coachProfileId", "poolId", "status"], _sum: { amount: true }, _count: true }),
    prisma.user.count({ where: { referralCodeId: { not: null } } }),
  ]);
  const total = (s: keyof typeof STATUS) => totals.find((t) => t.status === s)?._sum.amount ?? 0;

  const coachIds = [...new Set(byRecipient.map((r) => r.coachProfileId).filter((x): x is string => !!x))];
  const poolIds = [...new Set(byRecipient.map((r) => r.poolId).filter((x): x is string => !!x))];
  const [coachNames, poolNames] = await Promise.all([
    coachIds.length ? prisma.coachProfile.findMany({ where: { id: { in: coachIds } }, select: { id: true, user: { select: { name: true } } } }) : [],
    poolIds.length ? prisma.pool.findMany({ where: { id: { in: poolIds } }, select: { id: true, name: true } }) : [],
  ]);
  const nameOf = new Map<string, string>([
    ...coachNames.map((c) => [`c:${c.id}`, `Coach ${c.user.name}`] as [string, string]),
    ...poolNames.map((p) => [`p:${p.id}`, p.name] as [string, string]),
  ]);
  type Sum = { name: string; members: number; released: number; pending: number; waiting: number };
  const summary = new Map<string, Sum>();
  for (const g of byRecipient) {
    const key = g.coachProfileId ? `c:${g.coachProfileId}` : `p:${g.poolId}`;
    const s = summary.get(key) ?? { name: nameOf.get(key) ?? "-", members: 0, released: 0, pending: 0, waiting: 0 };
    s.members += g._count;
    const amt = g._sum.amount ?? 0;
    if (g.status === "RELEASED") s.released += amt;
    if (g.status === "PENDING") s.pending += amt;
    if (g.status === "WAITING") s.waiting += amt;
    summary.set(key, s);
  }
  const summaryRows = [...summary.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.released + b.pending - (a.released + a.pending) || b.members - a.members);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Afiliasi</h1>
      <p className="mt-1 text-sm text-text-muted">
        {referred} member mendaftar dengan kode afiliasi. Sudah cair {formatRupiah(total("RELEASED"))} · masa tahan{" "}
        {formatRupiah(total("PENDING"))}. Komisi dibayar dari pendapatan SPH.
      </p>

      {summaryRows.length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <h2 className="mb-2 text-base font-semibold text-text">Per penerima</h2>
            {/* HP: satu blok per penerima; layar lebar: tabel. */}
            <ul className="flex flex-col divide-y divide-border sm:hidden">
              {summaryRows.map((s) => (
                <li key={s.key} className="py-2.5 text-sm">
                  <p className="font-medium text-text">
                    {s.name} <span className="font-normal text-text-subtle">· {s.members} member</span>
                  </p>
                  <p className="tabular-nums text-text-muted">
                    Cair {formatRupiah(s.released)} · tahan {formatRupiah(s.pending)} · menunggu {formatRupiah(s.waiting)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="max-sm:hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-subtle">
                    <th scope="col" className="py-2 pr-3 font-medium">Penerima</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">Member</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">Sudah cair</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">Masa tahan</th>
                    <th scope="col" className="py-2 text-right font-medium">Menunggu sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {summaryRows.map((s) => (
                    <tr key={s.key}>
                      <td className="py-2.5 pr-3 font-medium text-text">{s.name}</td>
                      <td className="py-2.5 pr-3 text-right text-text">{s.members}</td>
                      <td className="py-2.5 pr-3 text-right text-text">{formatRupiah(s.released)}</td>
                      <td className="py-2.5 pr-3 text-right text-text-muted">{formatRupiah(s.pending)}</td>
                      <td className="py-2.5 text-right text-text-muted">{formatRupiah(s.waiting)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-1 text-base font-semibold text-text">Rincian per member</h2>
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
          <ShowMoreLink href={listHref({ n: String(n + STEP) })} shown={rows.length} total={count} unit="komisi" />
        </CardBody>
      </Card>
    </main>
  );
}

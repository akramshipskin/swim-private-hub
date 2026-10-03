import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/datetime";
import { daysWithoutSlot, FREE_CHANGE_AFTER_DAYS, VIOLATION_LIMIT, VIOLATION_WINDOW_DAYS } from "@/lib/coach-slot-watch";

export const metadata = { title: "Coach Tanpa Jadwal | Swim Private Hub" };

// Penjaga jadwal coach (Hadi 3 Okt): paket yang coach-nya belum membuka jam
// kosong, dan jumlah pelanggaran per coach dalam 6 bulan. Admin yang menilai
// penonaktifan (3 pelanggaran) lewat menu Pengguna.
export default async function CoachTanpaJadwalPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const since = new Date(now.getTime() - VIOLATION_WINDOW_DAYS * 86_400_000);
  const [pkgs, violations] = await Promise.all([
    prisma.package.findMany({
      where: { noSlotSince: { not: null }, status: "ACTIVE" },
      orderBy: { noSlotSince: "asc" },
      select: {
        id: true,
        noSlotSince: true,
        freeCoachChangeAt: true,
        sisaSesi: true,
        expiredDate: true,
        coach: { select: { name: true } },
        pool: { select: { name: true } },
        dependent: { select: { name: true } },
        member: { select: { name: true } },
      },
    }),
    prisma.coachViolation.groupBy({ by: ["coachId"], where: { createdAt: { gt: since } }, _count: { _all: true } }),
  ]);
  const coachNames = new Map(
    (await prisma.user.findMany({ where: { id: { in: violations.map((v) => v.coachId) } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]),
  );

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Coach Tanpa Jadwal</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Diperiksa otomatis tiap pagi. Hari ke-2: coach diingatkan. Hari ke-{FREE_CHANGE_AFTER_DAYS}: member boleh ganti coach tanpa biaya dan coach tercatat 1 pelanggaran. {VIOLATION_LIMIT} pelanggaran dalam 6 bulan: nilai penonaktifan di menu Pengguna.
      </p>
      <Card className="mb-4">
        <CardBody>
          <h2 className="mb-2 text-lg font-semibold text-text">Paket yang belum bisa booking</h2>
          {pkgs.length === 0 ? (
            <p className="text-sm text-text-muted">Tidak ada. Semua coach sudah membuka jadwal untuk member aktifnya.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border text-sm">
              {pkgs.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="text-text">
                    <b>{p.coach?.name ?? "-"}</b> · {p.pool.name} · {p.dependent.name} ({p.member.name}) · sisa {p.sisaSesi} sesi
                    {p.expiredDate && ` · paket s.d. ${formatDateLabel(p.expiredDate)}`}
                  </span>
                  <span className={p.freeCoachChangeAt ? "font-medium text-danger-text" : "text-warning-text"}>
                    Hari ke-{daysWithoutSlot(p.noSlotSince!, now)}
                    {p.freeCoachChangeAt ? " · boleh ganti coach tanpa biaya" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <h2 className="mb-2 text-lg font-semibold text-text">Pelanggaran 6 bulan terakhir</h2>
          {violations.length === 0 ? (
            <p className="text-sm text-text-muted">Belum ada.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border text-sm">
              {violations
                .sort((a, b) => b._count._all - a._count._all)
                .map((v) => (
                  <li key={v.coachId} className="flex justify-between gap-2 py-2">
                    <span className="text-text">{coachNames.get(v.coachId) ?? v.coachId}</span>
                    <span className={v._count._all >= VIOLATION_LIMIT ? "font-semibold text-danger-text" : "text-text"}>
                      {v._count._all}x{v._count._all >= VIOLATION_LIMIT ? " · nilai penonaktifan" : ""}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </main>
  );
}

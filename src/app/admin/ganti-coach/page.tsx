import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { formatDateLabel } from "@/lib/datetime";
import { coachChangeAmount, remainingSessions } from "@/lib/coach-change";
import { expireStaleCoachChanges } from "@/lib/coach-change-actions-core";
import { releaseStalePayments } from "@/lib/stale-payments";
import DecideForm from "./decide-form";

export const metadata = { title: "Ganti Coach | Swim Private Hub" };

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu keputusan",
  AWAITING_PAYMENT: "Menunggu tambah bayar",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
  EXPIRED: "Batal (tidak dibayar)",
  CANCELLED: "Dibatalkan member",
};

export default async function AdminGantiCoachPage() {
  await requireRole("ADMIN");
  await releaseStalePayments();
  await expireStaleCoachChanges();
  const requests = await prisma.coachChangeRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      member: { select: { name: true } },
      fromCoach: { select: { name: true } },
      toCoach: { select: { name: true, coachProfile: { select: { pricePack4: true, pricePack8: true } } } },
      package: { include: { pool: { select: { name: true } }, dependent: { select: { name: true } } } },
    },
  });
  const open = requests.filter((r) => r.status === "PENDING");
  const rest = requests.filter((r) => r.status !== "PENDING");

  // Perkiraan selisih untuk pengajuan yang belum diputuskan (dihitung ulang saat disetujui).
  const previews = new Map<string, { sessions: number; amount: number } | null>();
  for (const r of open) {
    const p = r.package;
    const newPrice = p.totalSesi === 4 ? r.toCoach.coachProfile?.pricePack4 : p.totalSesi === 8 ? r.toCoach.coachProfile?.pricePack8 : null;
    if (p.poolPrice == null || p.coachPrice == null || p.serviceFee == null || newPrice == null) {
      previews.set(r.id, null);
      continue;
    }
    const sessions = await remainingSessions(prisma, p.id, p.sisaSesi);
    previews.set(r.id, { sessions, amount: coachChangeAmount({ totalSesi: p.totalSesi, poolPrice: p.poolPrice, coachPrice: p.coachPrice, serviceFee: p.serviceFee }, newPrice, sessions).amount });
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Ganti Coach</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Pengajuan member untuk ganti coach di kolam yang sama. Sisa sesi dihitung ulang dengan harga coach baru: lebih murah =
        selisih masuk saldo member; lebih mahal = member tambah bayar dalam 24 jam, ganti coach berlaku setelah lunas. Jadwal yang
        belum berjalan dengan coach lama dibatalkan otomatis dan coach lama diberi tahu.
      </p>

      <h2 className="mb-2 text-lg font-semibold text-text">Menunggu keputusan ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mb-8 text-sm text-text-muted">Tidak ada pengajuan baru.</p>
      ) : (
        <ul className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {open.map((r) => {
            const pv = previews.get(r.id);
            return (
              <li key={r.id}>
                <Card>
                  <CardBody className="flex flex-col gap-3">
                    <div>
                      <p className="text-base font-semibold text-text">
                        {r.package.dependent.name} <span className="font-normal text-text-muted">· akun {r.member.name}</span>
                      </p>
                      <p className="text-sm text-text-muted">
                        {r.package.pool.name} · {r.package.name} · diajukan {formatDateLabel(r.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-text">
                      {r.fromCoach.name} → <b>{r.toCoach.name}</b>
                    </p>
                    <blockquote className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text">{r.reason}</blockquote>
                    {pv ? (
                      <p className="text-sm text-text">
                        Sisa {pv.sessions} sesi ·{" "}
                        {pv.amount > 0
                          ? `member tambah bayar ${formatRupiah(pv.amount)}`
                          : pv.amount < 0
                            ? `${formatRupiah(-pv.amount)} masuk saldo member`
                            : "tanpa selisih harga"}
                      </p>
                    ) : (
                      <p className="text-sm text-danger-text">Coach baru belum memasang harga paket ini; tidak bisa disetujui.</p>
                    )}
                    <DecideForm requestId={r.id} approveLabel={pv && pv.amount > 0 ? "Setujui, minta tambah bayar" : "Setujui & pindahkan"} />
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-2 text-lg font-semibold text-text">Riwayat</h2>
      {rest.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {rest.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="min-w-0 text-text">
                {r.package.dependent.name} · {r.fromCoach.name} → {r.toCoach.name}
                {r.amount != null && r.amount !== 0 && (
                  <span className="text-text-muted"> · {r.amount > 0 ? `tambah bayar ${formatRupiah(r.amount)}` : `saldo ${formatRupiah(-r.amount)}`}</span>
                )}
                {r.adminNote && <span className="block text-xs text-text-subtle">Catatan: {r.adminNote}</span>}
              </span>
              <Badge tone={r.status === "COMPLETED" ? "success" : r.status === "AWAITING_PAYMENT" ? "warning" : "neutral"}>{statusLabel[r.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

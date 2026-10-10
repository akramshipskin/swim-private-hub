import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { CERT_BUCKET, signedObjectUrl } from "@/lib/storage";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResolveForm from "./resolve-form";

export const metadata = { title: "Laporan Coach | Swim Private Hub" };

function dateTime(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

// Laporan member atas coach (Hadi 10-11 Okt): bahan pemeriksaan dan bukti
// daftar hitam (Perjanjian Coach pasal 6). Lampiran dibuka lewat tautan sementara.
export default async function AdminLaporanCoachPage() {
  await requireRole("ADMIN");
  const reports = await prisma.coachReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      reporter: { select: { name: true, phone: true } },
      coach: { select: { id: true, name: true } },
    },
  });
  const counts = await prisma.coachReport.groupBy({ by: ["coachId"], _count: { _all: true } });
  const perCoach = new Map(counts.map((c) => [c.coachId, c._count._all]));
  const links = new Map(
    await Promise.all(
      reports.filter((r) => r.attachmentPath).map(async (r) => [r.id, await signedObjectUrl(CERT_BUCKET, r.attachmentPath!)] as const),
    ),
  );

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Laporan Coach</h1>
      <p className="mt-1 text-sm text-text-muted">
        Laporan member tentang coach, misalnya menawarkan les atau pembayaran di luar aplikasi. Pelanggaran pasal 6 Perjanjian Coach:
        akun dinonaktifkan dan masuk daftar hitam.
      </p>
      {reports.length === 0 ? (
        <Card className="mt-6"><CardBody className="py-10 text-center text-sm text-text-muted">Belum ada laporan.</CardBody></Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Card>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-text-muted">
                        Coach{" "}
                        <Link href={`/admin/users/${r.coach.id}`} className="font-semibold text-text hover:underline">
                          {r.coach.name}
                        </Link>{" "}
                        · {perCoach.get(r.coachId) ?? 1} laporan
                      </p>
                      <p className="text-xs text-text-subtle">
                        Dari {r.reporter.name}
                        {r.reporter.phone ? ` (${r.reporter.phone})` : ""} · {dateTime(r.createdAt)}
                      </p>
                    </div>
                    <Badge tone={r.status === "OPEN" ? "warning" : "success"}>{r.status === "OPEN" ? "Perlu Dicek" : "Selesai"}</Badge>
                  </div>
                  <p className="whitespace-pre-line text-sm text-text">{r.message}</p>
                  {links.get(r.id) && (
                    <a href={links.get(r.id)!} target="_blank" rel="noopener noreferrer" className="self-start text-sm font-medium text-brand-700 underline">
                      Lihat Tangkapan Layar
                    </a>
                  )}
                  {r.status === "OPEN" ? (
                    <ResolveForm reportId={r.id} />
                  ) : (
                    <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
                      Hasil: {r.resolution} {r.resolvedAt ? `(${dateTime(r.resolvedAt)})` : ""}
                    </p>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

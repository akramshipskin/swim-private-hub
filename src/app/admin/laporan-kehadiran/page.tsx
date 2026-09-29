import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AttendanceToggle from "@/components/attendance-toggle";
import ResolveForm from "./resolve-form";

export const metadata = { title: "Laporan Kehadiran | Swim Private Hub" };

function dateTime(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

// Laporan member atas status "Tidak Hadir" (lihat attendance-report.ts).
// Koreksi kehadiran lewat toggle biasa: mengubahnya ke Hadir otomatis
// membalik bagi hasil "tidak hadir" lalu mencatat bagi hasil normal.
export default async function AdminLaporanKehadiranPage() {
  await requireRole("ADMIN");
  const reports = await prisma.attendanceReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      booking: {
        select: {
          id: true,
          attended: true,
          member: { select: { name: true, phone: true } },
          package: { select: { dependent: { select: { name: true, isSelf: true } } } },
          availability: {
            select: {
              date: true,
              startTime: true,
              endTime: true,
              coach: { select: { name: true } },
              pool: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  const open = reports.filter((r) => r.status === "OPEN");
  const closed = reports.filter((r) => r.status === "RESOLVED");

  const renderReport = (r: (typeof reports)[number]) => {
    const b = r.booking;
    const a = b.availability;
    return (
      <Card key={r.id}>
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-text">
                {formatDateLabel(a.date)} · {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
              </p>
              <p className="text-sm text-text">
                Coach {a.coach.name} · {a.pool.name}
              </p>
              <p className="text-sm text-text-muted">
                Member {b.member.name}
                {b.member.phone ? ` (${b.member.phone})` : ""} · Peserta{" "}
                {b.package.dependent.isSelf ? "member sendiri" : b.package.dependent.name}
              </p>
              <p className="mt-1 text-xs text-text-subtle">Dilaporkan {dateTime(r.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-text-subtle">Status kehadiran sekarang</p>
              <AttendanceToggle bookingId={b.id} attended={b.attended} />
            </div>
          </div>
          <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text">
            {r.note ? `“${r.note}”` : "Member tidak menulis keterangan."}
          </p>
          {r.status === "OPEN" ? (
            <ResolveForm reportId={r.id} />
          ) : (
            <p className="text-sm text-text-muted">
              <Badge tone="neutral">Selesai</Badge> {r.resolvedAt ? dateTime(r.resolvedAt) : ""} · {r.resolution}
            </p>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Laporan Kehadiran</h1>
      <p className="mt-1 text-sm text-text-muted">
        Member melaporkan sesi yang ditandai Tidak Hadir padahal menurutnya hadir. Cek ke coach, ubah status kehadiran
        kalau memang salah (bagi hasil ikut dikoreksi otomatis), lalu tutup laporan dengan catatan yang akan dibaca member.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-text">Perlu diperiksa ({open.length})</h2>
      <div className="mt-3 flex flex-col gap-3">
        {open.length === 0 ? (
          <p className="text-sm text-text-muted">Tidak ada laporan yang menunggu.</p>
        ) : (
          open.map(renderReport)
        )}
      </div>

      {closed.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-text">Sudah ditutup</h2>
          <div className="mt-3 flex flex-col gap-3">{closed.map(renderReport)}</div>
        </>
      )}
    </main>
  );
}

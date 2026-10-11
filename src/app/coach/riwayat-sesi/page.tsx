import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { SearchForm, matchesQuery } from "@/components/search-form";
import { ShowMoreLink, listHref, pageSize } from "@/components/show-more-link";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import AttendanceToggle from "@/components/attendance-toggle";
import { ATTENDANCE_MARK_WINDOW_HOURS, NO_SHOW_COACH_SHARE_PERCENT, coachCanMarkAttendance } from "@/lib/policy";

export const metadata = { title: "Riwayat Sesi | Swim Private Hub" };

// Ratusan sesi lama: tampil 7 tanggal terbaru dulu, tombol menambah 7 tanggal.
const PAGE_DAYS = 7;

export default async function CoachRiwayatSesiPage({ searchParams }: { searchParams: Promise<{ q?: string; n?: string; f?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const onlyUnmarked = sp.f === "belum";
  const limit = pageSize(sp.n, PAGE_DAYS);
  const session = await requireRole("COACH");

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { coachId: session.user.id, endTime: { lte: new Date() } },
    },
    orderBy: { availability: { startTime: "desc" } },
    include: {
      package: { select: { name: true, dependent: { select: { id: true, name: true } } } },
      member: { select: { name: true } },
      availability: { include: { pool: { select: { name: true } } } },
    },
  });

  const validSessionCount = bookings.filter((b) => b.attended === true).length;
  const absentCount = bookings.filter((b) => b.attended === false).length;
  const unmarkedCount = bookings.filter((b) => b.attended === null).length;

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }
  const byDate = new Map<string, typeof bookings>();
  for (const b of bookings.filter((x) => (!onlyUnmarked || x.attended === null) && matchesQuery(q, x.package.dependent.name, x.member.name, x.availability.pool.name))) {
    const key = dateKey(b.availability.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(b);
  }
  const allDateKeys = [...byDate.keys()].sort().reverse();
  const sortedDateKeys = allDateKeys.slice(0, limit);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Riwayat Sesi</h1>
      <SearchForm q={q} placeholder="Cari peserta, nama akun, atau kolam" />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Link href={listHref({ q: q || undefined, f: onlyUnmarked ? undefined : "belum" })} aria-label={onlyUnmarked ? "Tampilkan semua sesi" : "Tampilkan hanya sesi yang belum ditandai"} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <Card className={onlyUnmarked ? "border-brand-500" : undefined}><CardBody className="py-3"><p className="text-sm text-text-muted">Belum Ditandai</p><p className={`text-2xl font-bold ${unmarkedCount > 0 ? "text-warning-text" : "text-text"}`}>{unmarkedCount}</p></CardBody></Card>
        </Link>
        <Card><CardBody className="py-3"><p className="text-sm text-text-muted">Hadir</p><p className="text-2xl font-bold text-success-text">{validSessionCount}</p></CardBody></Card>
        <Card><CardBody className="py-3"><p className="text-sm text-text-muted">Tidak Hadir</p><p className="text-2xl font-bold text-text">{absentCount}</p></CardBody></Card>
      </div>
      <p className="mb-4 text-sm text-text-muted">Tandai kehadiran paling lambat {ATTENDANCE_MARK_WINDOW_HOURS} jam setelah sesi selesai; lewat itu hanya admin yang bisa menandai. Hadir: kamu dan kolam mendapat bagian penuh. Tidak Hadir (peserta sudah booking tapi tidak datang): kamu mendapat {NO_SHOW_COACH_SHARE_PERCENT}% dari bagianmu.</p>
      {onlyUnmarked && (
        <p className="mb-4 text-sm text-text-muted">
          Menampilkan hanya sesi yang belum ditandai.{" "}
          <Link href={listHref({ q: q || undefined })} className="font-medium text-brand-700 underline">Tampilkan semua</Link>
        </p>
      )}

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">
              Belum ada sesi yang sudah lewat waktunya untuk ditandai.
            </p>
          </CardBody>
        </Card>
      ) : sortedDateKeys.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">{q ? <>Tidak ada hasil untuk &quot;{q}&quot;</> : "Semua sesi sudah ditandai"}</p>
            <p className="mt-1 text-sm text-text-muted">{q ? "Coba kata kunci lain: nama peserta, member, atau kolam." : "Tidak ada yang perlu kamu tandai sekarang."}</p>
          </CardBody>
        </Card>
      ) : (
        sortedDateKeys.map((key) => {
          const rows = byDate.get(key)!;
          return (
            <div key={key} className="mb-5">
              <h2 className="mb-3 text-lg font-semibold text-text">
                {formatDateLabel(rows[0].availability.date)}
              </h2>
              {[...new Set(rows.map((r) => r.availability.pool.name))].map((poolName) => (
              <div key={poolName} className="mb-3">
              <h3 className="mb-2 text-sm font-semibold text-brand-700">{poolName}</h3>
              <ul className="flex flex-col gap-2">
                {rows.filter((r) => r.availability.pool.name === poolName).map((b) => (
                  <Card key={b.id}>
                    <CardBody className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-text tabular-nums">
                          {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
                        </p>
                        <p className="text-sm text-text">
                          Peserta: {b.package.dependent.name}{" "}
                          <Link href={`/milestone/${b.package.dependent.id}`} className="font-medium text-brand-700 underline">
                            Update milestone
                          </Link>
                        </p>
                        <p className="text-sm text-text-muted">
                          Akun {b.member.name} · {b.package.name}
                        </p>
                        {b.attended !== null && b.attendedBy && (
                          <p className="mt-0.5 text-xs text-text-subtle">
                            ditandai {b.attendedBy === "COACH" ? "coach" : "admin"}
                          </p>
                        )}
                      </div>
                      <AttendanceToggle
                        bookingId={b.id}
                        attended={b.attended}
                        lockedReason={
                          coachCanMarkAttendance(b.availability.endTime)
                            ? undefined
                            : `Lewat ${ATTENDANCE_MARK_WINDOW_HOURS} jam, hubungi admin`
                        }
                      />
                    </CardBody>
                  </Card>
                ))}
              </ul>
              </div>
              ))}
            </div>
          );
        })
      )}
      <ShowMoreLink href={listHref({ q: q || undefined, f: onlyUnmarked ? "belum" : undefined, n: String(limit + PAGE_DAYS) })} shown={sortedDateKeys.length} total={allDateKeys.length} unit="tanggal" />
    </main>
  );
}

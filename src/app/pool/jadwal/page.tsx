import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";
import { todayWibDateString, dateLabel, addDaysToDateString, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { groupByHour } from "@/lib/pool-occupancy";
import { Card, CardBody } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Jadwal per jam buat pemilik kolam: jam mana dipakai les privat (dan oleh
// siapa), jam mana ada slot kosong, jam mana tidak ada les sama sekali.
export const metadata = { title: "Jadwal Kolam | Swim Private Hub" };

export default async function PoolJadwalPage({ searchParams }: { searchParams: Promise<{ date?: string; q?: string }> }) {
  const session = await requireRole("POOL_OWNER");
  const { date, q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const dateStr = date && DATE.test(date) ? date : todayWibDateString();

  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      openTime: true,
      closeTime: true,
      dailyCapacity: true,
      availabilities: {
        where: { date: dateLabel(dateStr), ...NOT_CLOSED },
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          endTime: true,
          status: true,
          coach: { select: { name: true } },
          bookings: {
            where: { status: "BOOKED" },
            select: {
              id: true,
              member: { select: { name: true } },
              package: { select: { dependent: { select: { name: true, isSelf: true } } } },
            },
          },
        },
      },
    },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum terhubung ke kolam mana pun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">Pemakaian kolam untuk les privat per jam.</p>

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, -1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"><span aria-hidden="true">&larr;</span><span className="max-sm:sr-only">&nbsp;Sebelumnya</span></Link>
        {/* Di HP form-nya ambil satu baris penuh dan tanggalnya yang melar
            (flex-1), bukan dipatok w-72 -- lebar tetap bikin tombol Lihat
            kedorong keluar layar. Di layar >=sm baru dipatok 72 supaya
            popup kalendernya pas selebar tombolnya, gak nyembul nabrak
            tombol sebelahnya. */}
        <form className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <DatePicker name="date" defaultValue={dateStr} className="min-w-0 flex-1 sm:w-72 sm:flex-none" />
          <button type="submit" className="min-h-[44px] shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-fixed-ink-deep">Lihat</button>
        </form>
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"><span className="max-sm:sr-only">Berikutnya&nbsp;</span><span aria-hidden="true">&rarr;</span></Link>
      </div>
      <form className="mt-3 flex max-w-xl gap-2" role="search">
        <input type="hidden" name="date" value={dateStr} />
        <label htmlFor="jadwal-q" className="sr-only">Cari kode booking, peserta, atau coach</label>
        <input id="jadwal-q" name="q" defaultValue={q} placeholder="Cari kode booking, peserta, atau coach" className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button type="submit" className="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-fixed-ink-deep">Cari</button>
        {q && <Link href={`/pool/jadwal?date=${dateStr}`} className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-surface-muted">Reset</Link>}
      </form>
      <p className="mt-3 text-base font-semibold text-text">{formatDateLabel(dateLabel(dateStr))}</p>

      {pools.map((p) => {
        // Tampilan loket (Hadi 12 Okt, penilaian UI/UX): satu baris per sesi
        // berisi jam, peserta, coach, dan kode booking tebal supaya petugas bisa
        // mencocokkan kode di HP member dalam hitungan detik. Jam kosong coach
        // diringkas jadi jumlah (rinciannya bisa dibuka).
        const needle = q.toLowerCase();
        const sessions = p.availabilities
          .filter((a) => a.status === "BOOKED" && a.bookings[0])
          .map((a) => {
            const b = a.bookings[0];
            const dep = b.package.dependent;
            return {
              key: b.id,
              start: a.startTime,
              end: a.endTime,
              coach: a.coach.name,
              participant: dep.isSelf ? b.member.name : dep.name,
              account: dep.isSelf ? null : b.member.name,
              // Kode booking sama dengan yang tampil di kartu "Booking hari ini" HP
              // member, untuk dicocokkan di loket (Hadi 2 Okt malam, #18b).
              code: b.id.slice(-6).toUpperCase(),
            };
          })
          .filter((x) => !q || `${x.coach} ${x.participant} ${x.account ?? ""} ${x.code}`.toLowerCase().includes(needle));
        const openByCoach = new Map<string, Date[]>();
        if (!q) {
          for (const a of p.availabilities) {
            if (a.status === "BOOKED") continue;
            openByCoach.set(a.coach.name, [...(openByCoach.get(a.coach.name) ?? []), a.startTime]);
          }
        }
        const openCount = [...openByCoach.values()].reduce((n, t) => n + t.length, 0);
        const quietHours = groupByHour(
          p.availabilities.map((a) => ({ startTime: a.startTime, endTime: a.endTime, booked: a.status === "BOOKED", coachName: a.coach.name })),
          p.openTime,
          p.closeTime
        ).filter((r) => r.booked.length === 0 && r.open.length === 0);
        const bookedTotal = p.availabilities.reduce((n, a) => n + a.bookings.length, 0);
        return (
          <Card key={p.id} className="mt-4 w-full">
            <CardBody>
              <h2 className="text-lg font-semibold text-text">{p.name}</h2>
              {/* Kapasitas harian pelanggan SPH (Hadi 3 Okt): booking baru ditolak bila penuh. */}
              <p className="mb-3 text-sm text-text-muted">
                {p.dailyCapacity == null
                  ? `${bookedTotal} sesi SPH dibooking di tanggal ini · kapasitas harian belum diisi (tidak dibatasi)`
                  : `${bookedTotal} dari kapasitas ${p.dailyCapacity} sesi SPH terpakai`}
              </p>

              {sessions.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {q ? `Tidak ada sesi yang cocok dengan "${q}" di tanggal ini.` : "Belum ada sesi les yang dibooking di tanggal ini."}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="max-sm:sr-only">
                    <tr className="border-b border-border text-left text-xs font-medium text-text-subtle">
                      <th scope="col" className="py-2 pr-3 font-medium">Jam</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Peserta</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Coach</th>
                      <th scope="col" className="py-2 text-right font-medium">Kode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((x) => (
                      <tr key={x.key} className="max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:gap-x-3 max-sm:py-2.5">
                        <td className="whitespace-nowrap py-2.5 pr-3 align-top font-semibold tabular-nums text-text max-sm:py-0">
                          {/* HP: jam mulai saja (sesi selalu 1 jam) supaya kolom peserta tidak terjepit. */}
                          <span className="sm:hidden">{formatTimeWib(x.start)}</span>
                          <span className="max-sm:hidden">{formatTimeWib(x.start)}–{formatTimeWib(x.end)}</span>
                        </td>
                        <td className="py-2.5 pr-3 align-top text-text max-sm:col-start-2 max-sm:row-start-1 max-sm:py-0">
                          <span className="font-medium">{x.participant}</span>
                          {x.account && <span className="block text-xs text-text-subtle">akun {x.account}</span>}
                          <span className="block text-xs text-text-subtle sm:hidden">Coach {x.coach}</span>
                        </td>
                        <td className="py-2.5 pr-3 align-top text-text-muted max-sm:hidden">{x.coach}</td>
                        <td className="py-2.5 text-right align-top max-sm:col-start-3 max-sm:row-start-1 max-sm:py-0">
                          <span className="font-mono text-base font-bold tracking-wider text-text">{x.code}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {openCount > 0 && (
                <details className="group mt-3 border-t border-border pt-3">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-sm text-text-muted lg:min-h-0 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-text">{openCount} jam kosong coach</span> belum dibooking
                    <span aria-hidden="true" className="transition-transform group-open:rotate-180">↓</span>
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {[...openByCoach.entries()].map(([coach, times]) => (
                      <li key={coach} className="text-sm text-text-muted">
                        <span className="font-medium text-text">{coach}</span>: {times.map((t) => formatTimeWib(t)).join(", ")}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {/* Jam tanpa les diringkas satu baris (dulu satu baris per jam). */}
              {!q && quietHours.length > 0 && (
                <p className="mt-3 border-t border-border pt-3 text-sm text-text-subtle">
                  Tidak ada les: {quietHours.map((r) => `${String(r.hour).padStart(2, "0")}:00`).join(", ")}
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </main>
  );
}

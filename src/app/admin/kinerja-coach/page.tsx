import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { dateLabel, formatDateLabel, resolveDateRange } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listHref } from "@/components/show-more-link";

const SORTS = {
  valid: { label: "Sesi valid", key: "valid" },
  belum: { label: "Belum ditandai", key: "unmarked" },
  tidak: { label: "Tidak Hadir", key: "notHadir" },
} as const;
type SortKey = keyof typeof SORTS;

export const metadata = { title: "Kinerja Coach | Swim Private Hub" };

export default async function KinerjaCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; urut?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const { from, to } = resolveDateRange(params.from, params.to, 6);

  const fromDate = dateLabel(from);
  const toDateExclusive = new Date(dateLabel(to));
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { date: { gte: fromDate, lt: toDateExclusive } },
    },
    include: { availability: { include: { coach: { select: { id: true, name: true } }, pool: { select: { name: true } } } } },
  });

  // Per coach, lalu dipecah per kolam tempat sesi berlangsung.
  type Counts = { valid: number; notHadir: number; unmarked: number };
  const byCoach = new Map<string, { name: string; total: Counts; pools: Map<string, Counts> }>();
  const empty = (): Counts => ({ valid: 0, notHadir: 0, unmarked: 0 });
  for (const b of bookings) {
    const coach = b.availability.coach;
    if (!byCoach.has(coach.id)) byCoach.set(coach.id, { name: coach.name, total: empty(), pools: new Map() });
    const entry = byCoach.get(coach.id)!;
    const poolName = b.availability.pool.name;
    if (!entry.pools.has(poolName)) entry.pools.set(poolName, empty());
    const key: keyof Counts = b.attended === true ? "valid" : b.attended === false ? "notHadir" : "unmarked";
    entry.total[key]++;
    entry.pools.get(poolName)![key]++;
  }

  // Tabel yang bisa diurutkan + coach tanpa sesi valid dilipat (Hadi 12 Okt,
  // penilaian UI/UX: dulu satu kartu besar per coach).
  const sort: SortKey = params.urut && params.urut in SORTS ? (params.urut as SortKey) : "valid";
  const sortKey = SORTS[sort].key;
  const rows = [...byCoach.values()].sort((a, b) => b.total[sortKey] - a.total[sortKey] || a.name.localeCompare(b.name, "id"));
  const activeRows = rows.filter((r) => r.total.valid > 0);
  const zeroRows = rows.filter((r) => r.total.valid === 0);
  const totalValid = rows.reduce((n, r) => n + r.total.valid, 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Kinerja Coach</h1>
      <p className="mb-6 text-sm text-text-muted">
        Jumlah sesi valid (peserta benar-benar hadir) per coach di rentang tanggal. Angka ini dasar hitung
        bagi hasil coach.
      </p>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
            <Field label="Dari">
              <DatePicker name="from" defaultValue={from} className="sm:w-56" />
            </Field>
            <Field label="Sampai">
              <DatePicker name="to" defaultValue={to} className="sm:w-56" />
            </Field>
            <Button type="submit">Terapkan</Button>
          </form>
          <p className="mt-3 text-xs text-text-subtle">
            {formatDateLabel(fromDate)} &ndash; {formatDateLabel(dateLabel(to))}
          </p>
        </CardBody>
      </Card>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada booking di rentang tanggal ini.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text">
            Total sesi valid: <b>{totalValid}</b> dari {rows.length} coach
          </p>
          <Card>
            <CardBody className="py-2">
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-text-subtle">
                      <th scope="col" className="py-2 pr-3 font-medium">Coach dan kolam</th>
                      {(Object.keys(SORTS) as SortKey[]).map((k) => (
                        <th key={k} scope="col" aria-sort={sort === k ? "descending" : "none"} className="py-2 pr-3 text-right font-medium last:pr-0">
                          <Link
                            href={listHref({ from, to, urut: k === "valid" ? undefined : k })}
                            scroll={false}
                            className={`inline-flex min-h-[44px] items-center gap-1 lg:min-h-0 ${sort === k ? "font-semibold text-text" : "hover:text-text"}`}
                          >
                            {SORTS[k].label}
                            {sort === k && <span aria-hidden="true">↓</span>}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {(activeRows.length > 0 ? activeRows : rows).map((r) => (
                      <tr key={r.name}>
                        <td className="py-2.5 pr-3 align-top">
                          <p className="font-medium text-text">{r.name}</p>
                          <p className="text-xs text-text-subtle">
                            {[...r.pools.entries()].map(([poolName, c]) => `${poolName} ${c.valid}`).join(" · ")}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3 text-right align-top text-base font-semibold text-text">{r.total.valid}</td>
                        <td className={`py-2.5 pr-3 text-right align-top ${r.total.unmarked > 0 ? "font-medium text-warning-text" : "text-text-subtle"}`}>{r.total.unmarked}</td>
                        <td className="py-2.5 text-right align-top text-text-muted">{r.total.notHadir}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
          {activeRows.length > 0 && zeroRows.length > 0 && (
            <details className="group rounded-2xl border border-border bg-surface">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
                Coach tanpa sesi valid ({zeroRows.length})
                <span aria-hidden="true" className="text-text-muted transition-transform group-open:rotate-180">↓</span>
              </summary>
              <ul className="flex flex-col divide-y divide-border border-t border-border px-4 text-sm">
                {zeroRows.map((r) => (
                  <li key={r.name} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span className="font-medium text-text">{r.name}</span>
                    <span className="text-text-muted">
                      {r.total.unmarked > 0 && <span className="text-warning-text">{r.total.unmarked} belum ditandai</span>}
                      {r.total.unmarked > 0 && r.total.notHadir > 0 && " · "}
                      {r.total.notHadir > 0 && <>{r.total.notHadir} Tidak Hadir</>}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-text-subtle">
        Booking yang belum ditandai atau ditandai Tidak Hadir tidak dihitung sebagai sesi valid. Cek
        di menu Jadwal Booking atau Laporan Kehadiran.
      </p>
    </main>
  );
}

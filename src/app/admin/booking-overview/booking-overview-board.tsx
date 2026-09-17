"use client";

import { useMemo, useState } from "react";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import AdminCancelButton from "./admin-cancel-button";
import AttendanceToggle from "@/components/attendance-toggle";

type Availability = {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  coach: { id: string; name: string };
  pool: { name: string };
  bookings: {
    id: string;
    attended: boolean | null;
    member: { name: string; email: string | null };
    package: { dependent: { name: string; isSelf: boolean } };
  }[];
};

function dateKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function buildKabarinWaLink(coachName: string, dateLabel: string) {
  const message = `Halo semua! Coach ${coachName} baru saja buka jadwal baru tanggal ${dateLabel}. Buruan booking sebelum kehabisan slot ya! 🏊`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

type Period = "upcoming" | "unmarked" | "past" | "all";

export default function BookingOverviewBoard({
  availabilities,
  coaches,
}: {
  availabilities: Availability[];
  coaches: { id: string; name: string }[];
}) {
  const [selectedCoach, setSelectedCoach] = useState("all");
  const [selectedPool, setSelectedPool] = useState("all");
  const [period, setPeriod] = useState<Period>("upcoming");
  const [query, setQuery] = useState("");
  const now = useMemo(() => new Date(), []);
  const todayKey = dateKey(now);
  const poolNames = useMemo(() => [...new Set(availabilities.map((a) => a.pool.name))].sort(), [availabilities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availabilities.filter((a) => {
      if (selectedCoach !== "all" && a.coach.id !== selectedCoach) return false;
      if (selectedPool !== "all" && a.pool.name !== selectedPool) return false;
      const b = a.bookings[0];
      const past = a.endTime <= now;
      if (period === "upcoming" && dateKey(a.date) < todayKey) return false;
      if (period === "unmarked" && !(past && b && b.attended === null)) return false;
      if (period === "past" && !past) return false;
      // Slot kosong yang sudah lewat tidak berguna ditampilkan.
      if (past && !b && period !== "all") return false;
      if (!q) return true;
      return [a.coach.name, a.pool.name, b?.member.name, b?.package.dependent.name]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [availabilities, selectedCoach, selectedPool, period, query, now, todayKey]);

  // Kelompok: coach -> tanggal -> kolam.
  const byCoach = useMemo(() => {
    const map = new Map<string, { coachName: string; byDate: Map<string, Availability[]> }>();
    for (const a of filtered) {
      if (!map.has(a.coach.id)) map.set(a.coach.id, { coachName: a.coach.name, byDate: new Map() });
      const group = map.get(a.coach.id)!;
      const dKey = dateKey(a.date);
      if (!group.byDate.has(dKey)) group.byDate.set(dKey, []);
      group.byDate.get(dKey)!.push(a);
    }
    return map;
  }, [filtered]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Booking</h1>
      <p className="mt-1 mb-4 text-sm text-text-muted">Semua slot coach: siapa, tanggal berapa, di kolam mana, dan dibooking siapa.</p>

      <Card className="mb-6">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Cari
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nama coach, member, peserta, kolam"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Periode
            <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-full">
              <option value="upcoming">Hari ini &amp; mendatang</option>
              <option value="unmarked">Lewat, belum ditandai hadir</option>
              <option value="past">Sudah lewat</option>
              <option value="all">Semua</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Coach
            <Select value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)} className="w-full">
              <option value="all">Semua coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Kolam
            <Select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} className="w-full">
              <option value="all">Semua kolam</option>
              {poolNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </label>
        </CardBody>
      </Card>

      {byCoach.size === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-muted">Tidak ada slot yang cocok dengan filter.</CardBody>
        </Card>
      ) : (
        [...byCoach.entries()].map(([coachId, group]) => {
          const allSlots = [...group.byDate.values()].flat();
          const filledCount = allSlots.filter((a) => a.bookings.length > 0).length;
          return (
            <section key={coachId} className="mb-8">
              <h2 className="mb-3 text-xl font-semibold text-text">
                {group.coachName} <span className="text-sm font-normal text-text-muted">({filledCount}/{allSlots.length} terisi)</span>
              </h2>
              {[...group.byDate.keys()].sort().map((dKey) => {
                const rows = group.byDate.get(dKey)!;
                return (
                  <div key={dKey} className="mb-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-text">{formatDateLabel(rows[0].date)}</h3>
                      {dKey >= todayKey && (
                        <a
                          href={buildKabarinWaLink(group.coachName, formatDateLabel(rows[0].date))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-whatsapp px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.28 4.9L2 22l5.25-1.38a9.96 9.96 0 004.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-9.84-10.01-9.84zm5.87 14.1c-.25.7-1.45 1.33-2 1.42-.51.08-1.15.11-1.86-.12-.43-.13-.98-.32-1.69-.62-2.97-1.28-4.9-4.28-5.05-4.48-.15-.2-1.22-1.62-1.22-3.09s.77-2.19 1.05-2.49c.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.18-.32.4-.45.53-.15.15-.3.32-.13.62.17.3.77 1.27 1.65 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.65-.08.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.42z" />
                          </svg>
                          Kabarin Grup WhatsApp
                        </a>
                      )}
                    </div>
                    {[...new Set(rows.map((r) => r.pool.name))].map((poolName) => (
                      <div key={poolName} className="mb-3">
                        <p className="mb-1.5 text-sm font-semibold text-brand-700">{poolName}</p>
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                          {rows
                            .filter((r) => r.pool.name === poolName)
                            .map((a) => {
                              const booking = a.bookings[0];
                              const isPast = a.endTime <= now;
                              return (
                                <Card key={a.id}>
                                  <CardBody className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                      <p className="text-base font-semibold text-text tabular-nums">
                                        {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                                      </p>
                                      {booking ? (
                                        <>
                                          <p className="text-sm text-text">Peserta: {booking.package.dependent.isSelf ? booking.member.name : booking.package.dependent.name}</p>
                                          <p className="truncate text-sm text-text-muted">Akun: {booking.member.name}{booking.member.email ? ` · ${booking.member.email}` : ""}</p>
                                        </>
                                      ) : (
                                        <p className="text-sm text-text-subtle">Belum ada yang booking</p>
                                      )}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                      {booking ? (
                                        isPast ? (
                                          <AttendanceToggle bookingId={booking.id} attended={booking.attended} />
                                        ) : (
                                          <>
                                            <Badge tone="brand">Terisi</Badge>
                                            <AdminCancelButton bookingId={booking.id} />
                                          </>
                                        )
                                      ) : (
                                        <Badge tone="neutral">{isPast ? "Lewat" : "Kosong"}</Badge>
                                      )}
                                    </div>
                                  </CardBody>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>
          );
        })
      )}
    </>
  );
}

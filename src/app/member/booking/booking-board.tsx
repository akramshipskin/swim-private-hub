"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";

type ChildOption = {
  dependentId: string;
  dependentName: string;
  packageId: string;
  packageName: string;
  sisaSesi: number;
  jatahCancel: number;
  cancelRemaining: number;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED";
  coach: { id: string; name: string };
  bookedByMe: boolean;
  bookingId: string | null;
  bookedForChildName: string | null;
  canCancel: boolean;
  cancelReason?: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function todayWib() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

// Polling murni -- SSE dicabut, gak cocok jalan di Vercel serverless
// (function di-kill paksa tiap 300 detik). 5 detik cukup deket real-time
// tanpa nahan koneksi kebuka terus.
const POLL_INTERVAL_MS = 5000;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function BookingBoard({ childOptions }: { childOptions: ChildOption[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [date, setDate] = useState(todayWib());
  const [packageId, setPackageId] = useState(childOptions[0]?.packageId ?? "");
  const selectedChild = childOptions.find((c) => c.packageId === packageId) ?? null;
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Slot | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Ganti tanggal cepat bisa bikin fetch tanggal lama nyampe belakangan
  // (network jitter/cold start) dan nimpa data tanggal baru yang udah
  // kepasang duluan. requestIdRef nolak response yang bukan dari fetch
  // terakhir yang di-trigger.
  const requestIdRef = useRef(0);

  const loadSlots = useCallback(async () => {
    const myRequestId = ++requestIdRef.current;
    const res = await fetch(`/api/availability?date=${date}`);
    if (requestIdRef.current !== myRequestId) return;
    if (res.ok) {
      const data = await res.json();
      if (requestIdRef.current !== myRequestId) return;
      setSlots(data.availabilities);
    }
  }, [date]);

  useEffect(() => {
    setSlots(null);
    loadSlots();
    const interval = setInterval(loadSlots, POLL_INTERVAL_MS);

    // Refetch pas user balik ke tab ini -- biar gak ada jendela stale
    // yang kelamaan pas dia sempet pindah tab terus balik lagi.
    function onVisible() {
      if (document.visibilityState === "visible") loadSlots();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadSlots);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadSlots);
    };
  }, [loadSlots]);

  const groupedByCoach = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, { coachName: string; slots: Slot[] }>();
    for (const s of slots) {
      if (!map.has(s.coach.id)) {
        map.set(s.coach.id, { coachName: s.coach.name, slots: [] });
      }
      map.get(s.coach.id)!.slots.push(s);
    }
    return [...map.values()]
      .sort((a, b) => a.coachName.localeCompare(b.coachName))
      .map((g) => ({
        ...g,
        slots: g.slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [slots]);

  async function handleBook(availabilityId: string) {
    if (!packageId) {
      setMessage({ text: "Pilih anak dulu sebelum booking", ok: false });
      return;
    }
    setPendingId(availabilityId);
    setMessage(null);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilityId, packageId }),
    });

    const data = await res.json();
    setPendingId(null);

    if (!res.ok) {
      setMessage({ text: data.error, ok: false });
      loadSlots();
      return;
    }

    setMessage({ text: "Booking berhasil! Cek di halaman Riwayat.", ok: true });
    loadSlots();
    router.refresh();
  }

  async function handleConfirmCancel() {
    if (!cancelTarget?.bookingId) return;
    setCancelLoading(true);
    const targetId = cancelTarget.id;

    const res = await fetch(`/api/booking/${cancelTarget.bookingId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    setCancelLoading(false);
    setCancelTarget(null);

    if (!res.ok) {
      setMessage({ text: data.error, ok: false });
      loadSlots();
      return;
    }

    // Update slot ini instan di state lokal -- loadSlots()+router.refresh()
    // masih jalan buat sinkron beneran, tapi feedback visual gak nunggu
    // round-trip RSC lagi di atas DELETE yang barusan (kerasa lambat kalau
    // latency ke DB tinggi).
    setSlots((prev) =>
      prev
        ? prev.map((s) =>
            s.id === targetId
              ? { ...s, status: "AVAILABLE", bookedByMe: false, bookingId: null, bookedForChildName: null, canCancel: false }
              : s
          )
        : prev
    );
    setMessage({ text: "Booking dibatalkan, kuota sesi kamu balik.", ok: true });
    loadSlots();
    router.refresh();
  }

  return (
    <div>
      <Card className="mb-4">
        <CardBody className="flex flex-col gap-3 py-3 sm:flex-row sm:items-end sm:flex-wrap">
          <Field label="Buat anak">
            <Select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full sm:w-56"
            >
              {childOptions.length === 0 && <option value="">-- belum ada paket aktif --</option>}
              {childOptions.map((c) => (
                <option key={c.packageId} value={c.packageId}>
                  {c.dependentName} — {c.packageName}, sisa {c.sisaSesi} sesi
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal" className="w-full sm:w-56">
            <AvailabilityDatePicker value={date} onChange={setDate} />
          </Field>
          {selectedChild && (
            <div className="flex items-center gap-2 sm:mb-2.5">
              <Badge tone="brand">Sisa sesi: {selectedChild.sisaSesi}</Badge>
              <Badge tone={selectedChild.cancelRemaining <= 1 ? "warning" : "neutral"}>
                Sisa jatah batal: {selectedChild.cancelRemaining}
              </Badge>
            </div>
          )}
        </CardBody>
      </Card>

      {message && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            message.ok
              ? "bg-success-bg text-success-text"
              : "bg-danger-bg text-danger-text"
          }`}
        >
          {message.text}
        </p>
      )}

      {slots === null ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Memuat jadwal">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[68px] animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </ul>
      ) : slots.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Belum ada jadwal di tanggal ini</p>
            <p className="mt-1 text-sm text-text-muted">Coba pilih tanggal lain.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
          {groupedByCoach.map((group) => (
            <div key={group.coachName}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(group.coachName)}
                </div>
                <h2 className="text-base font-semibold text-text">{group.coachName}</h2>
              </div>

              <ul className="flex flex-col gap-2">
                {group.slots.map((s) => (
                  <Card key={s.id}>
                    <CardBody className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">
                          {formatTime(s.startTime)}–{formatTime(s.endTime)}
                        </p>
                        {s.bookedByMe && s.canCancel && s.bookedForChildName && (
                          <p className="text-center text-sm font-medium text-text">
                            buat {s.bookedForChildName}
                          </p>
                        )}
                      </div>

                      {s.bookedByMe ? (
                        s.canCancel ? (
                          <Button size="sm" variant="danger" onClick={() => setCancelTarget(s)}>
                            Batalkan
                          </Button>
                        ) : new Date(s.startTime) <= new Date() ? (
                          <p className="text-xs font-medium text-text-subtle">Sesi udah lewat</p>
                        ) : (
                          <div className="flex max-w-[220px] flex-col items-end gap-1.5 text-right">
                            <p className="text-xs font-medium text-text">
                              Booking kamu{s.bookedForChildName && ` — buat ${s.bookedForChildName}`}
                            </p>
                            <p className="text-xs text-text-subtle">{s.cancelReason}</p>
                            <a
                              href={buildAdminCancelWaLink({
                                memberName: session?.user?.name ?? "Member",
                                childName:
                                  s.bookedForChildName === "kamu sendiri"
                                    ? undefined
                                    : (s.bookedForChildName ?? undefined),
                                coachName: s.coach.name,
                                dateLabel: formatFullDate(s.startTime),
                                timeRange: `${formatTime(s.startTime)}-${formatTime(s.endTime)}`,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                            >
                              Hubungi Admin (WA)
                            </a>
                          </div>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant={s.status === "BOOKED" ? "secondary" : "primary"}
                          disabled={s.status === "BOOKED" || pendingId === s.id || !packageId}
                          loading={pendingId === s.id}
                          onClick={() => handleBook(s.id)}
                        >
                          {s.status === "BOOKED" ? "Sudah dibooking" : "Booking"}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Batalkan booking ini?"
        description={
          cancelTarget
            ? `${cancelTarget.coach.name}, ${formatTime(cancelTarget.startTime)}–${formatTime(cancelTarget.endTime)}. Kuota sesi kamu bakal balik, tapi jatah pembatalan mandiri berkurang.`
            : ""
        }
        confirmLabel="Ya, batalkan"
        loading={cancelLoading}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED";
  coach: { id: string; name: string };
  bookedByMe: boolean;
  bookingId: string | null;
  canCancel: boolean;
  cancelReason?: string;
  hasCancelRequest: boolean;
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

// SSE nangkep perubahan real-time; polling ini cuma jaring pengaman kalau
// koneksi SSE putus (network flaky, dst).
const POLL_FALLBACK_MS = 15000;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function BookingBoard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [date, setDate] = useState(todayWib());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Slot | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

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
    const interval = setInterval(loadSlots, POLL_FALLBACK_MS);

    // Refetch pas user balik ke tab ini -- biar gak ada jendela stale
    // yang kelamaan pas dia sempet pindah tab terus balik lagi.
    function onVisible() {
      if (document.visibilityState === "visible") loadSlots();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadSlots);

    // Real-time: begitu ada booking/cancel di mana pun (coach manapun,
    // member manapun), server push event ini -- refetch langsung, gak
    // nunggu interval polling.
    const eventSource = new EventSource("/api/availability/stream");
    eventSource.onmessage = () => loadSlots();
    // Kalau koneksi SSE putus (server restart, jaringan flaky) terus
    // nyambung ulang, browser auto-reconnect tapi event yang kelewat pas
    // putus itu gak ke-replay -- refetch begitu konek lagi biar sinkron.
    eventSource.onopen = () => loadSlots();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadSlots);
      eventSource.close();
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
    setPendingId(availabilityId);
    setMessage(null);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilityId }),
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

    setMessage({ text: "Booking dibatalkan, kuota sesi kamu balik.", ok: true });
    loadSlots();
    router.refresh();
  }

  async function handleRequestCancel(bookingId: string) {
    setRequestingId(bookingId);
    setMessage(null);

    const res = await fetch(`/api/booking/${bookingId}/cancel-request`, { method: "POST" });
    const data = await res.json();
    setRequestingId(null);

    if (!res.ok) {
      setMessage({ text: data.error, ok: false });
      return;
    }

    setMessage({ text: "Pengajuan pembatalan terkirim, tunggu admin proses.", ok: true });
    loadSlots();
  }

  return (
    <div>
      <Card className="mb-4">
        <CardBody className="flex items-center gap-3 py-3">
          <Field label="Tanggal">
            <div className="max-w-[16rem]">
              <AvailabilityDatePicker value={date} onChange={setDate} />
            </div>
          </Field>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(group.coachName)}
                </div>
                <h2 className="text-sm font-semibold text-text">{group.coachName}</h2>
              </div>

              <ul className="flex flex-col gap-2">
                {group.slots.map((s) => (
                  <Card key={s.id}>
                    <CardBody className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm font-medium text-text">
                        {formatTime(s.startTime)}–{formatTime(s.endTime)}
                      </p>

                      {s.bookedByMe ? (
                        s.canCancel ? (
                          <Button size="sm" variant="danger" onClick={() => setCancelTarget(s)}>
                            Batalkan
                          </Button>
                        ) : new Date(s.startTime) <= new Date() ? (
                          <p className="text-xs font-medium text-text-subtle">Sesi udah lewat</p>
                        ) : (
                          <div className="flex max-w-[220px] flex-col items-end gap-1.5 text-right">
                            <p className="text-xs font-medium text-text">Booking kamu</p>
                            <p className="text-xs text-text-subtle">{s.cancelReason}</p>
                            {s.hasCancelRequest ? (
                              <Badge tone="warning">Pengajuan nunggu admin</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={requestingId === s.bookingId}
                                onClick={() => handleRequestCancel(s.bookingId!)}
                              >
                                Ajukan Pembatalan ke Admin
                              </Button>
                            )}
                            <a
                              href={buildAdminCancelWaLink({
                                memberName: session?.user?.name ?? "Member",
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
                          disabled={s.status === "BOOKED" || pendingId === s.id}
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

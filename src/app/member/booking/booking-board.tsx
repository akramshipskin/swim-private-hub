"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT } from "@/lib/policy";
import { useSession } from "next-auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";
import { DateQuickPicker } from "@/components/date-quick-picker";
import { Avatar } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";

type PackageOption = {
  packageId: string;
  packageName: string;
  dependentId: string;
  poolId: string;
  sisaSesi: number;
  cancelRemaining: number;
};

type DependentOption = { id: string; name: string };

type PoolOption = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  facilities: string[];
  photos: string[];
  hours: string | null;
  singleSessionPrice: number | null;
  packagePerSession: number | null;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED";
  coach: { id: string; name: string; photoUrl: string | null };
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

export default function BookingBoard({
  dependents,
  packageOptions,
  pools,
  canBuySingleSession,
}: {
  dependents: DependentOption[];
  packageOptions: PackageOption[];
  pools: PoolOption[];
  canBuySingleSession: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [date, setDate] = useState(todayWib());
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  // Default: anak & kolam dari paket aktif pertama, biar begitu buka
  // halaman langsung bisa booking tanpa ganti pilihan.
  const [dependentId, setDependentId] = useState(
    packageOptions[0]?.dependentId ?? dependents[0]?.id ?? ""
  );
  const [poolId, setPoolId] = useState(packageOptions[0]?.poolId ?? pools[0]?.id ?? "");
  // Paket cuma berlaku di kolam tempat beli -- paket yang dipake = paket
  // aktif paling lama milik anak ini DI kolam ini. Gak ada = gak bisa
  // booking di sini (tawarin beli 1 sesi).
  const selectedPkg =
    packageOptions.find((p) => p.dependentId === dependentId && p.poolId === poolId) ?? null;
  const packageId = selectedPkg?.packageId ?? "";
  const selectedPool = pools.find((p) => p.id === poolId) ?? null;
  const dependentPoolNames = [
    ...new Set(
      packageOptions
        .filter((p) => p.dependentId === dependentId)
        .map((p) => pools.find((pool) => pool.id === p.poolId)?.name)
        .filter(Boolean)
    ),
  ];
  const [buyLoading, setBuyLoading] = useState(false);
  const [confirmBuy, setConfirmBuy] = useState(false);
  // Kolam tempat member punya paket aktif (lintas semua peserta).
  const activePoolSummary = pools
    .map((pool) => ({
      pool,
      sisa: packageOptions.filter((p) => p.poolId === pool.id).reduce((n, p) => n + p.sisaSesi, 0),
    }))
    .filter((x) => x.sisa > 0);
  // Slot disimpan bersama kunci (tanggal|kolam) asalnya: ganti tanggal/kolam
  // langsung dianggap "belum dimuat" tanpa setState di dalam effect.
  const slotsKey = `${date}|${poolId}`;
  const [slotsState, setSlotsState] = useState<{ key: string; slots: Slot[] } | null>(null);
  const slots = useMemo(
    () => (!poolId ? [] : slotsState?.key === slotsKey ? slotsState.slots : null),
    [poolId, slotsState, slotsKey]
  );
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
  const [loadError, setLoadError] = useState(false);

  const loadSlots = useCallback(async () => {
    // Slot tetep bisa dilihat di kolam manapun; booking-nya yang butuh
    // paket di kolam itu (lihat selectedPkg). Belum ada kolam dipilih =
    // belum ada yang bisa ditampilin.
    if (!poolId) return;
    const myRequestId = ++requestIdRef.current;
    // Gagal muat (jaringan/500) dulu diem aja -> loader muter selamanya.
    // Polling tetap jalan; error dihapus lagi begitu muat berhasil.
    try {
      const res = await fetch(`/api/availability?date=${date}&poolId=${poolId}`);
      if (requestIdRef.current !== myRequestId) return;
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (requestIdRef.current !== myRequestId) return;
      setSlotsState({ key: `${date}|${poolId}`, slots: data.availabilities });
      setLoadError(false);
    } catch {
      if (requestIdRef.current === myRequestId) setLoadError(true);
    }
  }, [date, poolId]);

  useEffect(() => {
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
    const map = new Map<string, { coachName: string; photoUrl: string | null; slots: Slot[] }>();
    for (const s of slots) {
      if (!map.has(s.coach.id)) {
        map.set(s.coach.id, { coachName: s.coach.name, photoUrl: s.coach.photoUrl, slots: [] });
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

  async function handleBuySingleSession() {
    setBuyLoading(true);
    setMessage(null);
    const res = await fetch("/api/payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependentId, singleSessionPoolId: poolId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBuyLoading(false);
      setMessage({ text: data.error ?? "Gagal memulai pembayaran", ok: false });
      return;
    }
    window.location.href = data.redirectUrl;
  }

  async function handleBook(availabilityId: string) {
    if (!packageId) {
      setMessage({ text: "Peserta ini belum punya paket di kolam ini", ok: false });
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
    setSlotsState((prevState) => {
      if (!prevState) return prevState;
      const prev = prevState.slots;
      return {
        ...prevState,
        slots: prev.map((s) =>
          s.id === targetId
            ? { ...s, status: "AVAILABLE" as const, bookedByMe: false, bookingId: null, bookedForChildName: null, canCancel: false }
            : s
        ),
      };
    });
    setMessage({ text: "Booking dibatalkan, sesi kembali ke paketmu.", ok: true });
    loadSlots();
    router.refresh();
  }

  return (
    <div>
      {activePoolSummary.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text">Paket aktifmu berlaku di:</span>
            {activePoolSummary.map(({ pool, sisa }) => (
              <button
                key={pool.id}
                type="button"
                onClick={() => setPoolId(pool.id)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${pool.id === poolId ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border text-text hover:bg-surface-muted"}`}
              >
                {pool.name} · sisa {sisa} sesi
              </button>
            ))}
          </div>
          {/* Rincian paket peserta terpilih ikut di baris ini (Hadi 18 Sep),
              supaya area pilih peserta/kolam/tanggal di bawah tetap bersih. */}
          {selectedPkg && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <Badge tone="brand">Sisa sesi: {selectedPkg.sisaSesi}</Badge>
              <Badge tone={selectedPkg.cancelRemaining <= 1 ? "warning" : "neutral"}>
                Sisa jatah batal: {selectedPkg.cancelRemaining}
              </Badge>
              <Badge tone="neutral">{selectedPkg.packageName}</Badge>
            </div>
          )}
        </div>
      )}
      <Card className="mb-4">
        <CardBody className="flex flex-col gap-3 py-3 sm:flex-row sm:items-end sm:flex-wrap">
          <Field label="Buat peserta">
            <Select
              value={dependentId}
              onChange={(e) => setDependentId(e.target.value)}
              className="w-full sm:w-56"
            >
              {dependents.length === 0 && <option value="">-- belum ada peserta --</option>}
              {dependents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kolam">
            <Select
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              className="w-full sm:w-60"
            >
              {pools.length === 0 && <option value="">-- belum ada kolam --</option>}
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal" className="w-full sm:w-56">
            {/* Mobile: pill 8 hari terdekat, lebih cepet buat kasus umum
                (booking minggu ini/depan). Desktop: kalender popup yang
                udah ada -- lebih pas buat lompat jauh ke depan, dan pill
                8-lebar bakal ganggu alignment sejajar sama field lain. */}
            <div className="sm:hidden">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-subtle">
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-brand-500" /> ada slot kosong
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullCalendar((v) => !v)}
                  className="font-medium text-brand-700 underline underline-offset-2"
                >
                  {showFullCalendar ? "Tutup kalender" : "Pilih tanggal lain"}
                </button>
              </div>
              {/* Fallback buat booking di luar window 8 hari pill --
                  defaultOpen biar langsung nongol popup-nya begitu toggle,
                  gak perlu 2x tap (toggle, lalu tap trigger internal).
                  Dirender DI ATAS pill row biar popup-nya (yang buka ke
                  bawah dari trigger-nya) numpuk visual di atas pill. */}
              {showFullCalendar && (
                <div className="mb-2">
                  <AvailabilityDatePicker
                    fetchUrl={`/api/availability/available-dates?poolId=${poolId}`}
                    value={date}
                    onChange={(d) => {
                      setDate(d);
                      setShowFullCalendar(false);
                    }}
                    defaultOpen
                  />
                </div>
              )}
              <DateQuickPicker
                value={date}
                onChange={setDate}
                days={8}
                fetchUrl={`/api/availability/available-dates?poolId=${poolId}`}
              />
            </div>
            <div className="hidden sm:block">
              <AvailabilityDatePicker
                value={date}
                onChange={setDate}
                fetchUrl={`/api/availability/available-dates?poolId=${poolId}`}
              />
            </div>
          </Field>
        </CardBody>
      </Card>

      {dependentId && poolId && !selectedPkg && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text sm:flex-row sm:items-center sm:justify-between">
          <p>
            Belum ada paket aktif buat peserta ini di {selectedPool?.name}.
            {dependentPoolNames.length > 0 && <> Paketnya berlaku di: {dependentPoolNames.join(", ")}.</>}
            {!canBuySingleSession && " Beli paket dulu agar bisa booking."}
            {canBuySingleSession &&
              selectedPool?.singleSessionPrice == null &&
              " Kolam ini belum menjual 1 sesi."}
          </p>
          {canBuySingleSession && selectedPool?.singleSessionPrice != null ? (
            <Button size="sm" loading={buyLoading} onClick={() => setConfirmBuy(true)} className="shrink-0">
              Beli 1 sesi di sini — {formatRupiah(selectedPool.singleSessionPrice)}
            </Button>
          ) : (
            <Link href="/member/paket" className="shrink-0 font-medium underline">
              Lihat paket
            </Link>
          )}
        </div>
      )}

      {selectedPool && (selectedPool.address || selectedPool.hours || selectedPool.facilities.length > 0) && (
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-4 p-4 sm:flex-row">
            {selectedPool.photos.length > 0 && (
              <div className="flex gap-2 sm:w-64 sm:shrink-0">
                {selectedPool.photos.slice(0, 2).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url + i}
                    src={url}
                    alt={`Foto ${selectedPool.name}`}
                    className="h-24 min-w-0 flex-1 rounded-lg object-cover sm:h-28"
                  />
                ))}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-text">{selectedPool.name}</p>
              {selectedPool.address && <p className="text-sm text-text-muted">{selectedPool.address}</p>}
              {selectedPool.hours && <p className="text-sm text-text-muted">Buka {selectedPool.hours}</p>}
              {selectedPool.description && (
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">{selectedPool.description}</p>
              )}
              {selectedPool.facilities.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {selectedPool.facilities.map((f) => (
                    <li key={f} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-text-muted">
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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

      {slots === null && loadError ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Jadwal gagal dimuat</p>
            <p className="mt-1 text-sm text-text-muted">Cek koneksi internetmu. Halaman akan mencoba lagi otomatis.</p>
            <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => loadSlots()}>
              Coba lagi sekarang
            </Button>
          </CardBody>
        </Card>
      ) : slots === null ? (
        <div className="flex justify-center py-10" aria-busy="true">
          <Loader label="Memuat jadwal" />
        </div>
      ) : slots.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Belum ada jadwal di tanggal ini</p>
            <p className="mt-1 text-sm text-text-muted">Coba pilih tanggal lain.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {groupedByCoach.map((group) => (
            <div key={group.coachName}>
              <div className="mb-2 flex items-center gap-2">
                <Avatar src={group.photoUrl} className="h-8 w-8" />
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
                          <p className="text-xs font-medium text-text-subtle">Sesi sudah lewat</p>
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
                              className="inline-flex items-center gap-1.5 rounded-md bg-whatsapp px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
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

      {confirmBuy && selectedPool?.singleSessionPrice != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="buy-title">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-5 shadow-lg">
            <h2 id="buy-title" className="text-lg font-semibold text-text">Beli 1 sesi di {selectedPool.name}?</h2>
            <p className="mt-1 text-2xl font-bold text-text">{formatRupiah(selectedPool.singleSessionPrice)}</p>
            <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-text">
              <li>1 sesi les untuk <b>{dependents.find((d) => d.id === dependentId)?.name}</b>.</li>
              <li>Hanya berlaku di <b>{selectedPool.name}</b>, tidak bisa dipakai di kolam lain.</li>
              <li>Berlaku {DROP_IN_DURATION_DAYS} hari sejak pembayaran berhasil.</li>
              <li>Jatah batal 1x (paling lambat {CANCEL_WINDOW_HOURS} jam sebelum jadwal); sesinya kembali dan bisa dibooking ulang.</li>
              {selectedPool.packagePerSession != null && (
                <li>
                  Lebih mahal {DROP_IN_MARKUP_PERCENT}% dari harga per sesi paket di kolam ini ({formatRupiah(selectedPool.packagePerSession)}). Kalau
                  sering ke sini, beli paket lebih hemat.
                </li>
              )}
            </ul>
            <div className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm">
              <p className="font-semibold text-text">Tentang {selectedPool.name}</p>
              {selectedPool.address && <p className="text-text-muted">{selectedPool.address}</p>}
              {selectedPool.hours && <p className="text-text-muted">Buka {selectedPool.hours}</p>}
              {selectedPool.facilities.length > 0 && <p className="text-text-muted">Fasilitas: {selectedPool.facilities.join(", ")}</p>}
              {selectedPool.description && <p className="mt-1 text-text">{selectedPool.description}</p>}
              {!selectedPool.address && !selectedPool.hours && !selectedPool.description && selectedPool.facilities.length === 0 && (
                <p className="text-text-muted">Info kolam belum dilengkapi.</p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmBuy(false)} disabled={buyLoading}>Batal</Button>
              <Button size="sm" loading={buyLoading} onClick={handleBuySingleSession}>Lanjut ke pembayaran</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Batalkan booking ini?"
        description={
          cancelTarget
            ? `${cancelTarget.coach.name}, ${formatTime(cancelTarget.startTime)}–${formatTime(cancelTarget.endTime)}. Sisa sesi kamu akan kembali, tapi jatah batal berkurang.`
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

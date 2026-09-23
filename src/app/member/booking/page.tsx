import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import BookingBoard from "./booking-board";
import Link from "next/link";
import EnablePushButton from "@/components/enable-push-button";
import { activePackageWhere } from "@/lib/active-package";
import { dropInPrice } from "@/lib/drop-in";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";

export default async function MemberBookingPage() {
  const session = await requireRole("MEMBER");

  const children = await prisma.dependent.findMany({
    where: { memberId: session.user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  // Semua paket yang masih bisa dipake, per anak & per kolam -- paket cuma
  // berlaku di kolam tempat beli (revisi 2026-09-17), jadi 1 anak bisa
  // punya beberapa paket aktif di kolam beda. BookingBoard milih paket
  // dari kombinasi (anak, kolam) yang dipilih ortu.
  const usable = await prisma.package.findMany({
    where: activePackageWhere(session.user.id),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      dependentId: true,
      poolId: true,
      sisaSesi: true,
      jatahCancel: true,
      isSingleSession: true,
      _count: { select: { bookings: { where: { status: "CANCELLED", cancelledBy: "MEMBER" } } } },
    },
  });
  const packageOptions = usable.map((p) => ({
    packageId: p.id,
    packageName: p.name,
    dependentId: p.dependentId,
    poolId: p.poolId,
    sisaSesi: p.sisaSesi,
    cancelRemaining: Math.max(0, p.jatahCancel - p._count.bookings),
  }));
  const canBuySingleSession = usable.some((p) => !p.isSingleSession);

  const pools = (
    await prisma.pool.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        description: true,
        facilities: true,
        photos: true,
        openTime: true,
        closeTime: true,
        packageTemplates: { where: { isActive: true }, select: { price: true, totalSesi: true } },
      },
    })
  ).map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    description: p.description,
    facilities: p.facilities,
    photos: p.photos,
    hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
    singleSessionPrice: dropInPrice(p.packageTemplates),
    // Harga per sesi termahal tanpa markup, buat pembanding di konfirmasi.
    packagePerSession: p.packageTemplates.length
      ? Math.max(...p.packageTemplates.map((t) => Math.round(t.price / t.totalSesi)))
      : null,
  }));

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Booking Coach</h1>
          <p className="mt-1 text-sm text-text-muted">
            Pilih peserta, kolam, coach, dan jam. Slot yang sudah diambil otomatis terkunci.
          </p>
        </div>
        <EnablePushButton />
      </div>

      {children.length === 0 && (
        <div className="mb-6 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          Belum ada anak terdaftar.{" "}
          <Link href="/member/peserta" className="font-medium underline">
            Tambah anak dulu
          </Link>
          .
        </div>
      )}

      {children.length > 0 && packageOptions.length === 0 && (
        <div className="mb-6 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          Belum ada anak yang punya paket aktif dengan sisa sesi.{" "}
          <Link href="/member/paket" className="font-medium underline">
            Beli paket dulu
          </Link>
          .
        </div>
      )}

      {/* Mobile: collapse -- biar ada ruang buat elemen lain di atas
          BookingBoard (misal date picker), teks kebijakan lengkap gak
          wajib kebaca tiap buka halaman, tinggal tap kalau perlu.
          Desktop: tetep full text, ruang gak jadi masalah di layar lebar. */}
      <details className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-text marker:content-none [&::-webkit-details-marker]:hidden">
          KEBIJAKAN PEMBATALAN
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-text-subtle transition-transform [details[open]_&]:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </summary>
        <p className="mt-2">
          Pembatalan booking min. {CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesuai sisa jatah
          batal paket (lihat di bawah). Tidak hadir tanpa pembatalan = sesi tetap terpotong dan
          tidak dikembalikan. Jatah habis? Hubungi admin via WhatsApp.
        </p>
      </details>

      <div className="mb-6 hidden rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted sm:block">
        <p className="mb-1 font-medium text-text">KEBIJAKAN PEMBATALAN</p>
        <p>
          Pembatalan booking min. {CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesuai sisa jatah
          batal paket (lihat di bawah). Tidak hadir tanpa pembatalan = sesi tetap terpotong dan
          tidak dikembalikan. Jatah habis? Hubungi admin via WhatsApp.
        </p>
      </div>

      <BookingBoard
        dependents={children.map((c) => ({ id: c.id, name: c.name }))}
        packageOptions={packageOptions}
        pools={pools}
        canBuySingleSession={canBuySingleSession}
      />
    </main>
  );
}

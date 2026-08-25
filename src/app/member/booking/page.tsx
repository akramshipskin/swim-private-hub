import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import BookingBoard from "./booking-board";
import Link from "next/link";
import EnablePushButton from "@/components/enable-push-button";
import { activePackageWhereForDependent } from "@/lib/active-package";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";

export default async function MemberBookingPage() {
  const session = await requireRole("MEMBER");

  const children = await prisma.dependent.findMany({
    where: { memberId: session.user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  // 1 paket = 1 anak sekarang -- tiap anak bisa punya paket aktif sendiri,
  // gak ada FIFO lintas-anak lagi. Ortu pilih paket (== pilih anak) di
  // BookingBoard, bukan sistem yang nebak.
  const packagesByChild = await Promise.all(
    children.map(async (child) => {
      const pkg = await prisma.package.findFirst({
        where: activePackageWhereForDependent(session.user.id, child.id),
        orderBy: { createdAt: "asc" },
      });
      if (!pkg) return null;
      const cancelUsed = await prisma.booking.count({
        where: { packageId: pkg.id, status: "CANCELLED", cancelledBy: "MEMBER" },
      });
      return {
        dependentId: child.id,
        dependentName: child.name,
        packageId: pkg.id,
        packageName: pkg.name,
        sisaSesi: pkg.sisaSesi,
        jatahCancel: pkg.jatahCancel,
        cancelRemaining: Math.max(0, pkg.jatahCancel - cancelUsed),
      };
    })
  );
  const childOptions = packagesByChild.filter((c) => c !== null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Booking Coach</h1>
          <p className="mt-1 text-sm text-text-muted">
            Pilih anak, coach, dan jam. Slot yang udah diambil otomatis kekunci.
          </p>
        </div>
        <EnablePushButton />
      </div>

      {children.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-warning-bg px-4 py-3 text-sm text-warning-text">
          Belum ada anak terdaftar.{" "}
          <Link href="/profil" className="font-medium underline">
            Tambah anak dulu
          </Link>
          .
        </div>
      )}

      {children.length > 0 && childOptions.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-warning-bg px-4 py-3 text-sm text-warning-text">
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
          Batalkan sendiri min. {CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesuai sisa jatah
          batal paket anak (lihat di bawah). Gak hadir tanpa batal = sesi tetap kepotong, no
          refund. Jatah abis? Hubungi admin via WhatsApp.
        </p>
      </details>

      <div className="mb-6 hidden rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted sm:block">
        <p className="mb-1 font-medium text-text">KEBIJAKAN PEMBATALAN</p>
        <p>
          Batalkan sendiri min. {CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesuai sisa jatah
          batal paket anak (lihat di bawah). Gak hadir tanpa batal = sesi tetap kepotong, no
          refund. Jatah abis? Hubungi admin via WhatsApp.
        </p>
      </div>

      <BookingBoard childOptions={childOptions} />
    </main>
  );
}

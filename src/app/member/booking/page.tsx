import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import BookingBoard from "./booking-board";
import Link from "next/link";
import EnablePushButton from "@/components/enable-push-button";
import { activePackageWhereForDependent } from "@/lib/active-package";

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

      <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted">
        <p className="mb-1 font-medium text-text">Kebijakan pembatalan</p>
        <p>
          Booking bisa dibatalkan sendiri sesuai jatah paket anak yang bersangkutan. Kalau
          jatah udah abis, hubungi admin langsung lewat WhatsApp buat kasus khusus. Kalau
          udah booking tapi gak hadir tanpa dibatalin, sisa sesi tetap kepotong dan gak ada
          refund.
        </p>
      </div>

      <BookingBoard childOptions={childOptions} />
    </main>
  );
}

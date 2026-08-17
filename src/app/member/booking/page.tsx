import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import BookingBoard from "./booking-board";
import Link from "next/link";
import EnablePushButton from "@/components/enable-push-button";
import { Badge } from "@/components/ui/badge";
import { activePackageWhere } from "@/lib/active-package";

export default async function MemberBookingPage() {
  const session = await requireRole("MEMBER");

  const activePackage = await prisma.package.findFirst({
    where: activePackageWhere(session.user.id),
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Booking Coach</h1>
          <p className="mt-1 text-sm text-text-muted">
            Pilih coach dan jam. Slot yang udah diambil otomatis kekunci.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          {activePackage ? (
            <Badge tone="brand">Sisa sesi: {activePackage.sisaSesi}</Badge>
          ) : (
            <Badge tone="warning">Belum ada paket aktif</Badge>
          )}
          <EnablePushButton />
        </div>
      </div>

      {!activePackage && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-warning-bg px-4 py-3 text-sm text-warning-text">
          Kamu belum punya paket aktif dengan sisa sesi.{" "}
          <Link href="/member/paket" className="font-medium underline">
            Beli paket dulu
          </Link>
          .
        </div>
      )}

      <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted">
        <p className="mb-1 font-medium text-text">Kebijakan pembatalan</p>
        <p>
          Booking bisa dibatalkan sendiri sesuai jatah paket kamu. Kalau jatah udah abis,
          kamu masih bisa ajukan pembatalan ke admin (bisa di-approve atau ditolak). Kalau
          udah booking tapi gak hadir tanpa dibatalin/di-approve, sisa sesi tetap kepotong
          dan gak ada refund.
        </p>
      </div>

      <BookingBoard />
    </main>
  );
}

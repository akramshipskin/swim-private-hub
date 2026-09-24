"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditSessionRevenue, reverseSessionRevenue, ReversalBlockedError } from "@/lib/wallet";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { error?: string } | null;

// Coach & admin bisa nandain hadir/gak hadir di booking yang UDAH ADA
// (lewat jam sesinya). Ini cuma toggle status, gak ada jalur buat coach
// bikin booking/sesi baru sendiri -- biar aman dari coach nge-klaim sesi
// yang gak beneran kejadian.
export async function markAttendance(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH" && session.user.role !== "ADMIN") {
    return { error: "Tidak punya akses." };
  }

  const bookingId = formData.get("bookingId") as string;
  const attended = formData.get("attended") === "true";

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      availability: { include: { coach: { include: { coachProfile: true } } } },
      package: { include: { payments: { where: { status: "SUCCESS" }, take: 1 } } },
    },
  });

  if (!booking || booking.status !== "BOOKED") {
    return { error: "Booking tidak ditemukan atau sudah dibatalkan." };
  }
  if (session.user.role === "COACH" && booking.availability.coachId !== session.user.id) {
    return { error: "Bukan sesi kamu." };
  }
  if (booking.availability.endTime > new Date()) {
    return { error: "Belum waktunya, sesi ini belum selesai." };
  }

  const wasAttended = booking.attended === true;

  try {
    await prisma.$transaction(async (tx) => {
      // Conditional update (CAS) -- pola sama kayak cancelBooking (row lock
      // Package) buat cegah double-klik/double-submit dobel kredit wallet.
      // Tanpa `where: { attended: booking.attended }` ini, 2 request
      // bersamaan bisa DUA-DUANYA baca wasAttended=false sebelum salah
      // satu commit, jadi creditSessionRevenue kepanggil 2x buat booking
      // yang sama.
      // status: "BOOKED" juga ikut di CAS -- tanpa ini, booking yang
      // dibatalin di antara baca & update tetep bisa ditandai Hadir dan
      // wallet kekredit buat sesi yang udah CANCELLED (tes race lokal
      // 2026-09-17, 8 dari 8 percobaan).
      const claim = await tx.booking.updateMany({
        where: { id: bookingId, attended: booking.attended, status: "BOOKED" },
        data: {
          attended,
          attendedBy: session.user.role as "COACH" | "ADMIN",
          attendedAt: new Date(),
        },
      });
      if (claim.count === 0) {
        throw new Error("Booking ini baru saja diubah di tempat lain (dibatalkan/ditandai). Muat ulang halaman dulu.");
      }

      // Kredit wallet cuma jalan kalau paket ini beneran dibeli lewat
      // Midtrans (ada Payment SUCCESS) -- paket yang di-assign manual/gratis
      // sama admin gak punya uang beneran buat dibagi. coachProfile null
      // (harusnya gak mungkin tapi dicek jaga-jaga) juga skip.
      //
      // PENTING (revisi 2026-09-12, paket lintas-kolam): kolam yang
      // dikredit itu Booking.availability.poolId -- kolam TEMPAT SESI INI
      // BENERAN DIAJAR -- bukan booking.package.poolId (kolam tempat
      // paket dibeli, bisa beda kolam sekarang).
      const successPayment = booking.package.payments[0];
      const coachProfile = booking.availability.coach.coachProfile;
      if (!successPayment || !coachProfile) return;

      // floor, bukan round: round bisa bikin total semua sesi > harga
      // paket (100.000/6 -> 16.667 x 6 = 100.002), artinya kredit uang
      // yang gak pernah dibayar. floor bikin sisanya (< totalSesi rupiah
      // per paket) tetap di platform, sesuai aturan sisa pembulatan.
      const perSessionValue = Math.floor(successPayment.amount / booking.package.totalSesi);

      if (!wasAttended && attended) {
        await creditSessionRevenue(tx, {
          poolId: booking.availability.poolId,
          coachProfileId: coachProfile.id,
          bookingId,
          perSessionValue,
        });
      } else if (wasAttended && !attended) {
        await reverseSessionRevenue(tx, { bookingId });
      }
    });
  } catch (err) {
    if (err instanceof ReversalBlockedError) return { error: err.message };
    if (err instanceof Error && err.message.includes("baru saja diubah")) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/coach/riwayat-sesi");
  revalidatePath("/coach/saldo");
  revalidatePath("/admin/booking-overview");
  return null;
}

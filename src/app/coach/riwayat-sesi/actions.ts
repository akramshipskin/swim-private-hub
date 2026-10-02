"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditSessionRevenue, reverseSessionRevenue } from "@/lib/wallet";
import { pricesForSessionCoach } from "@/lib/coach-change";
import { ATTENDANCE_MARK_WINDOW_HOURS, coachCanMarkAttendance } from "@/lib/policy";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PARTNER_AGREEMENT_REQUIRED_ERROR } from "@/lib/partner-agreement";

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
  // Aksi ini mengkredit saldo; server action bisa dipanggil lewat alamat yang
  // tidak melewati pagar halaman, jadi gerbang perjanjian dicek di sini juga.
  if (session.user.role === "COACH" && session.user.needsPartnerAgreement) {
    return { error: PARTNER_AGREEMENT_REQUIRED_ERROR };
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
  // Keputusan Hadi 29 Sep: coach wajib menandai paling lambat 24 jam setelah
  // sesi selesai (termasuk mengubah tanda). Lewat itu hanya admin.
  if (session.user.role === "COACH" && !coachCanMarkAttendance(booking.availability.endTime)) {
    return { error: `Sudah lewat ${ATTENDANCE_MARK_WINDOW_HOURS} jam sejak sesi selesai. Hubungi admin untuk menandai kehadiran.` };
  }

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

      // Kredit wallet cuma jalan kalau paket ini beneran dibayar (ada Payment
      // SUCCESS, termasuk lunas dari saldo member) -- paket yang diberikan
      // manual oleh admin tidak punya uang untuk dibagi. Kolam yang dikredit =
      // kolam tempat sesi diajar (Booking.availability.poolId).
      const successPayment = booking.package.payments[0];
      const coachProfile = booking.availability.coach.coachProfile;
      if (!successPayment || !coachProfile) return;

      // Bagi hasil mengikuti tanda terbaru: Hadir = pembagian normal, Tidak
      // Hadir = bagian coach 50% (kolam Rp0). Ganti tanda = balik yang lama
      // (jumlah persis yang dulu dicatat) lalu catat yang baru. Tanda sama
      // dikirim ulang = tidak ada perubahan uang.
      if (booking.attended === attended) return;
      // Dibagi dari harga paket yang tersimpan (kolam + coach + layanan), bukan
      // Payment.amount -- sebagian harga bisa dibayar dari saldo member. Setelah
      // ganti coach, sesi yang diajar coach lama tetap memakai harga lama.
      // Tanpa harga tersimpan (paket model bagi hasil persen lama, sudah
      // dihapus Hadi 2 Okt malam) uang tidak dibagi otomatis: koreksi lewat admin.
      const sessionPrices = await pricesForSessionCoach(tx, booking.package, booking.availability.coachId, booking.availability.startTime);
      if (!sessionPrices) {
        throw new Error("Harga sesi ini tidak ditemukan. Hubungi admin.");
      }
      if (booking.attended !== null) await reverseSessionRevenue(tx, { bookingId });
      await creditSessionRevenue(tx, {
        poolId: booking.availability.poolId,
        coachProfileId: coachProfile.id,
        bookingId,
        attended,
        pricing: {
          paid: sessionPrices.poolPrice + sessionPrices.coachPrice + sessionPrices.serviceFee,
          totalSesi: booking.package.totalSesi,
          poolPrice: sessionPrices.poolPrice,
          coachPrice: sessionPrices.coachPrice,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("baru saja diubah") || err.message.includes("Harga sesi ini tidak ditemukan"))) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/coach/riwayat-sesi");
  revalidatePath("/coach/saldo");
  revalidatePath("/admin/booking-overview");
  return null;
}

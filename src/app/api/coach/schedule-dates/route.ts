import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";

// Tanggal mana yang UDAH ada slot dibuka -- coach manapun, bukan cuma
// yang lagi login (biar keliatan juga kalau coach lain udah isi jadwal
// di tanggal itu). Dipake date picker di halaman "Tambah Slot".
export async function GET(request: Request) {
  const session = await auth();
  // Coach yang belum menyetujui perjanjian kemitraan ditolak juga (rute ini
  // di luar matcher proxy.ts).
  if (!session || session.user.role !== "COACH" || session.user.needsPartnerAgreement) {
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!year || !month || month < 1 || month > 12) {
    return Response.json({ error: "Bulan tidak valid. Muat ulang halaman, lalu coba lagi." }, { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const rows = await prisma.availability.findMany({
    where: { date: { gte: from, lt: to }, ...NOT_CLOSED },
    select: { date: true },
    distinct: ["date"],
  });

  const dates = rows.map((r) => r.date.toISOString().slice(0, 10));

  return Response.json({ dates });
}

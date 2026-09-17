import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Buat kasih tau date picker member tanggal mana yang ada slot AVAILABLE
// (bisa dibooking) -- 1 request per bulan yang lagi dibuka, bukan per hari.
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-12

  if (!year || !month || month < 1 || month > 12) {
    return Response.json({ error: "year/month tidak valid" }, { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  // Titik "ada slot" harus sesuai kolam yang lagi dipilih member & cuma
  // slot yang jamnya belum lewat -- dulu nandain tanggal yang slotnya
  // cuma ada di kolam lain / udah lewat, member klik terus kosong.
  const poolId = searchParams.get("poolId") ?? undefined;

  const rows = await prisma.availability.findMany({
    where: {
      date: { gte: from, lt: to },
      status: "AVAILABLE",
      startTime: { gt: new Date() },
      ...(poolId ? { poolId } : {}),
    },
    select: { date: true },
    distinct: ["date"],
  });

  const dates = rows.map((r) => r.date.toISOString().slice(0, 10));

  return Response.json({ dates });
}

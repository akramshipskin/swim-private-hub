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
    return Response.json({ error: "year/month gak valid" }, { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const rows = await prisma.availability.findMany({
    where: { date: { gte: from, lt: to }, status: "AVAILABLE" },
    select: { date: true },
    distinct: ["date"],
  });

  const dates = rows.map((r) => r.date.toISOString().slice(0, 10));

  return Response.json({ dates });
}

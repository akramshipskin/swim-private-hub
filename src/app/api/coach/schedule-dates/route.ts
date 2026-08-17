import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Tanggal mana yang coach ini UDAH punya slot (kebooking atau belum, gak
// peduli) -- dipake date picker di halaman "Tambah Slot" biar coach gak
// lupa apa yang udah pernah dia buka pas milih tanggal buat slot baru.
export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "COACH") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!year || !month || month < 1 || month > 12) {
    return Response.json({ error: "year/month gak valid" }, { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const rows = await prisma.availability.findMany({
    where: { coachId: session.user.id, date: { gte: from, lt: to } },
    select: { date: true },
    distinct: ["date"],
  });

  const dates = rows.map((r) => r.date.toISOString().slice(0, 10));

  return Response.json({ dates });
}

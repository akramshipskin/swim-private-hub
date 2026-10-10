import * as XLSX from "xlsx";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { buildPphRecap, monthRangeWib, pphKey } from "@/lib/pph-recap";

// Unduhan rekap PPh final 0,5% per mitra untuk satu bulan: /api/admin/pph-rekap?bulan=2026-10
export async function GET(request: Request) {
  await requireRole("ADMIN");
  const month = new URL(request.url).searchParams.get("bulan") ?? "";
  const range = monthRangeWib(month);
  if (!range) return new Response("Format bulan harus YYYY-MM, contoh 2026-10.", { status: 400 });

  const monthRows = await prisma.walletTransaction.findMany({
    where: {
      createdAt: { gte: range.start, lt: range.end },
      type: { in: ["PPH_WITHHELD", "SESSION_REVENUE", "SESSION_PAYOUT"] },
      OR: [{ poolId: { not: null } }, { coachProfileId: { not: null } }],
    },
    select: { type: true, amount: true, poolId: true, coachProfileId: true, bookingId: true },
  });
  const bookingIds = [...new Set(monthRows.map((r) => r.bookingId).filter((id): id is string => !!id))];
  const pphRows = await prisma.walletTransaction.findMany({
    where: { type: "PPH_WITHHELD", bookingId: { in: bookingIds } },
    select: { bookingId: true, poolId: true, coachProfileId: true },
  });
  const keys = new Set(pphRows.flatMap((r) => (r.bookingId && (r.poolId ?? r.coachProfileId) ? [pphKey(r.bookingId, (r.poolId ?? r.coachProfileId)!)] : [])));
  const recap = buildPphRecap(monthRows, keys);

  const [pools, coaches] = await Promise.all([
    prisma.pool.findMany({ where: { id: { in: recap.filter((r) => r.kind === "Kolam").map((r) => r.ownerId) } }, select: { id: true, name: true, contactPhone: true, ownerships: { take: 1, orderBy: { createdAt: "asc" }, select: { owner: { select: { phone: true, email: true } } } } } }),
    prisma.coachProfile.findMany({
      where: { id: { in: recap.filter((r) => r.kind === "Coach").map((r) => r.ownerId) } },
      select: { id: true, user: { select: { name: true, phone: true, email: true } } },
    }),
  ]);
  const poolName = new Map(pools.map((p) => [p.id, p.name]));
  // Kontak kolam untuk akuntan (TRD T21): nomor kolam, atau HP/email pemilik pertama.
  const poolContact = new Map(pools.map((p) => [p.id, p.contactPhone ?? p.ownerships[0]?.owner.phone ?? p.ownerships[0]?.owner.email ?? ""]));
  const coachInfo = new Map(coaches.map((c) => [c.id, c.user]));

  const header = ["Jenis", "Nama", "Kontak", "Bruto bagian mitra (Rp)", "PPh final 0,5% dipotong (Rp)"];
  const body = recap
    .map((r) => {
      const coach = r.kind === "Coach" ? coachInfo.get(r.ownerId) : undefined;
      const name = r.kind === "Kolam" ? (poolName.get(r.ownerId) ?? r.ownerId) : (coach?.name ?? r.ownerId);
      const contact = r.kind === "Kolam" ? (poolContact.get(r.ownerId) ?? "") : (coach?.phone ?? coach?.email ?? "");
      return [r.kind, name, contact, r.gross, r.pph];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])));
  const total = ["", "Total", "", recap.reduce((s, r) => s + r.gross, 0), recap.reduce((s, r) => s + r.pph, 0)];

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body, total]);
  sheet["!cols"] = header.map((h) => ({ wch: Math.max(h.length, 18) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, `PPh ${month}`);
  const file = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-pph-${month}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

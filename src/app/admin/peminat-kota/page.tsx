import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { CITIES } from "@/lib/cities";

export const metadata = { title: "Peminat per Kota | Swim Private Hub" };

// Angka peminat per kota (Hadi 3 Okt): member di daftar tunggu kota yang
// belum punya paket, plus jumlah kolam aktif, coach, dan member per kota.
// Dipakai untuk memutuskan kota mana yang perlu dicari coach/kolamnya.
export default async function PeminatKotaPage() {
  await requireRole("ADMIN");
  const [waiting, notified, pools, coaches, members] = await Promise.all([
    prisma.cityWaitlist.groupBy({ by: ["city"], where: { notifiedAt: null }, _count: { _all: true } }),
    prisma.cityWaitlist.groupBy({ by: ["city"], where: { notifiedAt: { not: null } }, _count: { _all: true } }),
    prisma.pool.groupBy({ by: ["city"], where: { isActive: true }, _count: { _all: true } }),
    prisma.user.groupBy({ by: ["city"], where: { role: "COACH", isActive: true }, _count: { _all: true } }),
    prisma.user.groupBy({ by: ["city"], where: { role: "MEMBER", isActive: true }, _count: { _all: true } }),
  ]);
  const count = (rows: { city: string | null; _count: { _all: number } }[], c: string | null) =>
    rows.find((r) => r.city === c)?._count._all ?? 0;
  const rows = [...CITIES, null].map((c) => ({
    city: c,
    waiting: count(waiting, c),
    notified: count(notified, c),
    pools: count(pools, c),
    coaches: count(coaches, c),
    members: count(members, c),
  }));

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Peminat per Kota</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        &quot;Menunggu&quot; = member yang menekan Kabari saya karena kotanya belum punya paket. Mereka diberi tahu otomatis begitu paket pertama di kota itu bisa dibeli.
      </p>
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-muted text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Kota</th>
                <th className="px-4 py-2 text-right font-medium">Menunggu</th>
                <th className="px-4 py-2 text-right font-medium">Sudah dikabari</th>
                <th className="px-4 py-2 text-right font-medium">Kolam aktif</th>
                <th className="px-4 py-2 text-right font-medium">Coach aktif</th>
                <th className="px-4 py-2 text-right font-medium">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {rows.map((r) => (
                <tr key={r.city ?? "-"}>
                  <td className="px-4 py-2 font-medium text-text">{r.city ?? "Kota belum diisi"}</td>
                  <td className={`px-4 py-2 text-right ${r.waiting > 0 ? "font-semibold text-warning-text" : "text-text"}`}>{r.waiting}</td>
                  <td className="px-4 py-2 text-right text-text">{r.notified}</td>
                  <td className="px-4 py-2 text-right text-text">{r.pools}</td>
                  <td className="px-4 py-2 text-right text-text">{r.coaches}</td>
                  <td className="px-4 py-2 text-right text-text">{r.members}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </main>
  );
}

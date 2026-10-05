import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { formatRupiah } from "@/lib/format";
import { poolHoursLabel } from "@/lib/pool-hours";
import { OTHER_CITY_WARNING } from "@/lib/cities";
import { pickPool, releasePool } from "./actions";

export const metadata = { title: "Kolam Saya | Swim Private Hub" };

const MESSAGES: Record<string, string> = {
  pilih: "Kolam dipilih. Sekarang kamu bisa membuka jadwal di kolam ini lewat menu Jadwal.",
  lepas: "Kolam dilepas. Jam kosongmu di kolam itu ditutup.",
  member: "Belum bisa dilepas: masih ada member dengan paket aktif (atau menunggu bayar / pengajuan ganti coach) bersamamu di kolam ini.",
  kolam: "Kolam ini tidak tersedia. Muat ulang halaman lalu coba lagi.",
  nonaktif: "Akun coach kamu sedang tidak aktif. Hubungi admin.",
};

type PoolRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  openTime: string | null;
  closeTime: string | null;
  pricePack4: number | null;
  pricePack8: number | null;
  isActive: boolean;
};

// Coach memilih sendiri kolam tempat mengajar (Hadi 3 Okt). Kolam di kota
// domisili tampil dulu; kolam kota lain dilipat dengan peringatan.
export default async function CoachKolamPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await requireRole("COACH");
  const [me, pools, mine] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { city: true } }),
    prisma.pool.findMany({
      // Kolam yang sudah dipilih tetap tampil walau dinonaktifkan admin, supaya bisa dilepas.
      where: { OR: [{ isActive: true }, { affiliations: { some: { coachId: session.user.id } } }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true, city: true, isActive: true, openTime: true, closeTime: true, pricePack4: true, pricePack8: true },
    }),
    prisma.poolAffiliation.findMany({ where: { coachId: session.user.id }, select: { poolId: true } }),
  ]);
  const picked = new Set(mine.map((m) => m.poolId));
  const { ok, error } = await searchParams;
  const sameCity = pools.filter((p) => p.city === me.city);
  const otherCity = pools.filter((p) => p.city !== me.city);
  const pickedElsewhere = otherCity.filter((p) => picked.has(p.id));

  function row(p: PoolRow, other: boolean) {
    const isPicked = picked.has(p.id);
    return (
      <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-text">
            {p.name}
            {isPicked && <Badge tone="success">Kolam kamu</Badge>}
            {!p.isActive && <Badge tone="warning">Kolam sedang tidak aktif</Badge>}
            {other && <Badge tone="neutral">{p.city ?? "Kota belum diisi"}</Badge>}
          </p>
          <p className="text-sm text-text-muted">
            {[p.address, `Jam buka ${poolHoursLabel(p)}`].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm text-text-muted">
            Tiket kolam: {[p.pricePack4 != null && `4 sesi ${formatRupiah(p.pricePack4)}`, p.pricePack8 != null && `8 sesi ${formatRupiah(p.pricePack8)}`].filter(Boolean).join(" · ") || "belum dipasang"}
          </p>
        </div>
        {isPicked ? (
          <ConfirmSubmit
            action={releasePool.bind(null, p.id)}
            label="Lepas"
            variant="danger"
            title={`Lepas ${p.name}?`}
            description="Jam kosongmu di kolam ini akan ditutup dan member tidak bisa membeli paket denganmu di sini. Tidak bisa dilepas selama masih ada member aktif bersamamu di kolam ini."
            confirmLabel="Lepas kolam"
          />
        ) : other ? (
          <ConfirmSubmit
            action={pickPool.bind(null, p.id)}
            label="Pilih"
            title={`Pilih ${p.name}?`}
            description={OTHER_CITY_WARNING.COACH}
            confirmLabel="Tetap pilih"
          />
        ) : (
          <form action={pickPool.bind(null, p.id)}>
            <Button type="submit" size="sm">Pilih</Button>
          </form>
        )}
      </li>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Kolam Saya</h1>
      <p className="mt-1 mb-4 text-sm text-text-muted">
        Pilih kolam tempat kamu mengajar. Member bisa membeli paket denganmu di kolam yang kamu pilih, dan kamu membuka jadwal di sana lewat menu Jadwal. Kota domisili: <b className="text-text">{me.city}</b> (ganti di Profil).
      </p>
      {(ok || error) && (
        <p role={error ? "alert" : "status"} className={`mb-4 rounded-lg px-3 py-2 text-sm ${error ? "bg-danger-bg text-danger-text" : "bg-success-bg text-success-text"}`}>
          {MESSAGES[(error ?? ok)!] ?? ""}
        </p>
      )}
      <Card className="mb-4">
        <CardBody>
          <h2 className="text-lg font-semibold text-text">Kolam di {me.city}</h2>
          {sameCity.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Belum ada kolam mitra di {me.city}. Kamu tetap bisa memilih kolam di kota lain di bawah.</p>
          ) : (
            <ul className="mt-1 flex flex-col divide-y divide-border">{sameCity.map((p) => row(p, false))}</ul>
          )}
        </CardBody>
      </Card>
      {pickedElsewhere.length > 0 && (
        <Card className="mb-4">
          <CardBody>
            <h2 className="text-lg font-semibold text-text">Kolam kamu di kota lain</h2>
            <ul className="mt-1 flex flex-col divide-y divide-border">{pickedElsewhere.map((p) => row(p, true))}</ul>
          </CardBody>
        </Card>
      )}
      {otherCity.length > pickedElsewhere.length && (
        <details className="rounded-xl border border-border bg-surface">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-text max-lg:py-3">Kolam di kota lain</summary>
          <div className="px-4 pb-2">
            <p className="text-sm text-warning-text">{OTHER_CITY_WARNING.COACH}</p>
            <ul className="flex flex-col divide-y divide-border">{otherCity.filter((p) => !picked.has(p.id)).map((p) => row(p, true))}</ul>
          </div>
        </details>
      )}
    </main>
  );
}

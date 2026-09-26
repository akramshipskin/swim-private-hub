import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import AdjustForm from "./adjust-form";

export const metadata = { title: "Koreksi Saldo | Swim Private Hub" };

function signed(n: number) {
  return `${n < 0 ? "−" : "+"}${formatRupiah(Math.abs(n))}`;
}

function dateTime(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

// Koreksi saldo coach/kolam + riwayat semua koreksi (jejak audit di satu
// tempat). Koreksi = baris ledger tanpa bookingId, lihat wallet-adjustment.ts.
export default async function AdminKoreksiSaldoPage({ searchParams }: { searchParams: Promise<{ target?: string }> }) {
  await requireRole("ADMIN");
  const raw = (await searchParams).target ?? "";
  const [kind, id] = raw.split(":");

  const [coaches, pools] = await Promise.all([
    prisma.coachProfile.findMany({
      select: { id: true, walletBalance: true, user: { select: { name: true, isActive: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.pool.findMany({ select: { id: true, name: true, walletBalance: true }, orderBy: { name: "asc" } }),
  ]);

  const coach = kind === "coach" ? coaches.find((c) => c.id === id) : undefined;
  const pool = kind === "pool" ? pools.find((p) => p.id === id) : undefined;
  const selected = coach
    ? { type: "coach" as const, id: coach.id, name: coach.user.name, balance: coach.walletBalance }
    : pool
      ? { type: "pool" as const, id: pool.id, name: pool.name, balance: pool.walletBalance }
      : null;

  const rows = await prisma.walletTransaction.findMany({
    where: {
      bookingId: null,
      ...(selected?.type === "coach"
        ? { type: "SESSION_PAYOUT", coachProfileId: selected.id }
        : selected?.type === "pool"
          ? { type: "SESSION_REVENUE", poolId: selected.id }
          : { type: { in: ["SESSION_PAYOUT", "SESSION_REVENUE"] } }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { pool: { select: { name: true } }, coachProfile: { select: { user: { select: { name: true } } } } },
  });

  // Pasangan di pendapatan platform (sumber dana "dari/ke platform"): dicatat
  // dalam transaksi yang sama, jadi cocokkan lewat alasan + admin + waktu.
  const mirrors = await prisma.walletTransaction.findMany({
    where: { type: "PLATFORM_REVENUE", bookingId: null, note: { not: null } },
    select: { note: true, createdById: true, amount: true, createdAt: true },
  });
  const fromPlatform = (r: (typeof rows)[number]) =>
    mirrors.some(
      (m) => m.note === r.note && m.createdById === r.createdById && m.amount === -r.amount && Math.abs(m.createdAt.getTime() - r.createdAt.getTime()) < 5000
    );
  const adminIds = [...new Set(rows.map((r) => r.createdById).filter((x): x is string => !!x))];
  const admins = new Map(
    (adminIds.length ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name])
  );

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Koreksi Saldo</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tambah atau kurangi saldo coach/kolam dengan alasan. Setiap koreksi dicatat sebagai baris baru (tidak mengubah angka
        lama), tampil di halaman Saldo penerima, dan penerima dikabari lewat notifikasi.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardBody className="flex flex-col gap-4">
            <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field label="Coach atau kolam" className="flex-1">
                <Select name="target" defaultValue={selected ? `${selected.type}:${selected.id}` : ""} required>
                  <option value="" disabled>
                    Pilih coach atau kolam
                  </option>
                  <optgroup label="Coach">
                    {coaches.map((c) => (
                      <option key={c.id} value={`coach:${c.id}`}>
                        {c.user.name}
                        {c.user.isActive ? "" : " (nonaktif)"} · saldo {formatRupiah(c.walletBalance)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Kolam">
                    {pools.map((p) => (
                      <option key={p.id} value={`pool:${p.id}`}>
                        {p.name} · saldo {formatRupiah(p.walletBalance)}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </Field>
              <Button type="submit" variant="secondary">
                Pilih
              </Button>
            </form>

            {selected ? (
              <>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-sm text-text-muted">
                    {selected.type === "coach" ? "Coach" : "Kolam"} · {selected.name}
                  </p>
                  <p className={`whitespace-nowrap text-2xl font-bold ${selected.balance < 0 ? "text-danger-text" : "text-text"}`}>
                    {selected.balance < 0 ? `−${formatRupiah(-selected.balance)}` : formatRupiah(selected.balance)}
                  </p>
                  <p className="text-xs text-text-subtle">Saldo sekarang</p>
                </div>
                <AdjustForm key={`${selected.type}:${selected.id}`} targetType={selected.type} targetId={selected.id} targetName={selected.name} balance={selected.balance} />
              </>
            ) : (
              <p className="text-sm text-text-muted">Pilih coach atau kolam dulu untuk membuat koreksi.</p>
            )}
          </CardBody>
        </Card>

        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-text">{selected ? `Riwayat koreksi ${selected.name}` : "Riwayat semua koreksi"}</h2>
            {selected && (
              <Link href="/admin/koreksi-saldo" className="text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                Lihat semua
              </Link>
            )}
          </div>
          {rows.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-sm text-text-muted">Belum ada koreksi saldo.</CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <Card key={r.id}>
                  <CardBody className="flex flex-col gap-2 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-lg font-semibold ${r.amount < 0 ? "text-danger-text" : "text-success-text"}`}>{signed(r.amount)}</p>
                      <Badge tone="neutral">{r.coachProfile ? "Coach" : "Kolam"}</Badge>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-text-subtle">Penerima</dt>
                      <dd className="text-text">{r.coachProfile?.user.name ?? r.pool?.name ?? "-"}</dd>
                      <dt className="text-text-subtle">Alasan</dt>
                      <dd className="text-text">{r.note ?? "Koreksi lama (dicatat langsung di database, tanpa alasan)"}</dd>
                      <dt className="text-text-subtle">Sumber dana</dt>
                      <dd className="text-text">{r.note === null ? "-" : fromPlatform(r) ? "Dari/ke pendapatan platform" : "Membetulkan salah catat"}</dd>
                      <dt className="text-text-subtle">Waktu</dt>
                      <dd className="text-text">{dateTime(r.createdAt)}</dd>
                      <dt className="text-text-subtle">Oleh</dt>
                      <dd className="text-text">{r.createdById ? (admins.get(r.createdById) ?? "Admin") : "-"}</dd>
                    </dl>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

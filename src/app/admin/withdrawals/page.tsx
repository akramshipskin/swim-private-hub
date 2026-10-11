import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import WithdrawalRow from "./withdrawal-row";
import PlatformWithdrawForm from "./platform-withdraw-form";
import { getPlatformBalance } from "@/lib/platform-wallet";
import { PLATFORM_HOLD_DAYS } from "@/lib/policy";
import { isIrisConfigured } from "@/lib/disbursement";
import { openSecret } from "@/lib/secret-box";
import { isWithdrawalOverdue } from "@/lib/withdrawal-deadline";

const STATUS_FILTERS = {
  waiting: { label: "Perlu Diproses", statuses: ["PENDING", "PROCESSING"] },
  paid: { label: "Sudah Ditransfer", statuses: ["PAID"] },
  failed: { label: "Gagal / Ditolak", statuses: ["FAILED"] },
  all: { label: "Semua", statuses: ["PENDING", "PROCESSING", "PAID", "FAILED"] },
} as const;
type StatusKey = keyof typeof STATUS_FILTERS;

export const metadata = { title: "Tarik Saldo | Swim Private Hub" };

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; who?: string; pool?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status: StatusKey = params.status && params.status in STATUS_FILTERS ? (params.status as StatusKey) : params.pool ? "all" : "waiting";
  const who = params.who === "pool" || params.who === "coach" ? params.who : "all";

  const [requests, pools, totals, platform, platformHistory] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: {
        status: { in: [...STATUS_FILTERS[status].statuses] },
        ...(who === "pool" ? { poolId: { not: null } } : who === "coach" ? { coachProfileId: { not: null } } : {}),
        // Pengajuan coach gak terikat kolam (poolId null) -- filter kolam cuma
        // berlaku buat pengajuan kolam, biar "coach + kolam X" gak selalu kosong.
        ...(params.pool && who !== "coach" ? { poolId: params.pool } : {}),
      },
      orderBy: { requestedAt: "desc" },
      include: {
        pool: { select: { name: true, walletBalance: true } },
        coachProfile: { select: { walletBalance: true, user: { select: { name: true, phone: true } } } },
      },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.withdrawalRequest.groupBy({ by: ["status"], _count: true, _sum: { amount: true } }),
    getPlatformBalance(),
    prisma.platformWithdrawal.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const total = (keys: readonly string[]) => totals.filter((t) => keys.includes(t.status));
  const link = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { status, who, pool: params.pool, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "all") q.set(k, v);
    return `/admin/withdrawals?${q.toString()}`;
  };
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1 text-sm max-lg:min-h-[44px] ${active ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-border text-text hover:bg-surface-muted"}`;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Tarik Saldo</h1>
      <p className="mt-1 text-sm text-text-muted">
        Permintaan penarikan saldo dari kolam &amp; coach ke rekening mereka. Transfer manual lewat m-banking, lalu tandai
        dibayar. Pengajuan yang ditolak otomatis mengembalikan saldo.
      </p>


      <h2 className="mt-8 text-lg font-semibold text-text">Penarikan kolam &amp; coach</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["waiting", "paid", "failed"] as const).map((k) => {
          const rows = total(STATUS_FILTERS[k].statuses);
          return (
            <Link key={k} href={link({ status: k })}>
              <Card className={status === k ? "ring-2 ring-brand-500" : "hover:bg-surface-muted"}>
                <CardBody className="py-3">
                  <p className="text-sm text-text-muted">{STATUS_FILTERS[k].label}</p>
                  <p className="text-xl font-bold text-text">{formatRupiah(rows.reduce((n, r) => n + (r._sum.amount ?? 0), 0))}</p>
                  <p className="text-xs text-text-subtle">{rows.reduce((n, r) => n + r._count, 0)} pengajuan</p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-muted">Pemilik saldo:</span>
        <Link href={link({ who: "all" })} className={chip(who === "all")}>Semua</Link>
        <Link href={link({ who: "pool" })} className={chip(who === "pool")}>Kolam</Link>
        <Link href={link({ who: "coach" })} className={chip(who === "coach")}>Coach</Link>
      </div>
      <form action="/admin/withdrawals" className="mt-2 flex flex-wrap items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input type="hidden" name="who" value="pool" />
        <label htmlFor="saring-kolam" className="text-sm text-text-muted">Kolam:</label>
        <select id="saring-kolam" name="pool" defaultValue={params.pool ?? ""} className="min-h-[44px] rounded-xl border border-border bg-surface px-3 text-sm text-text">
          <option value="">Semua kolam</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="submit" className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted">
          Saring
        </button>
      </form>

      {requests.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">Tidak ada pengajuan untuk filter ini.</CardBody>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {requests.map((w) => (
            <WithdrawalRow
              irisEnabled={isIrisConfigured()}
              key={w.id}
              w={{
                id: w.id,
                amount: w.amount,
                status: w.status,
                requestedAt: w.requestedAt.toISOString(),
                overdue: isWithdrawalOverdue(w),
                processedAt: w.processedAt?.toISOString() ?? null,
                failureReason: w.failureReason,
                referenceId: w.midtransReferenceId ?? w.transferReference,
                bankName: w.bankName,
                bankAccountNumber: openSecret(w.bankAccountNumber),
                bankAccountName: w.bankAccountName,
                holderType: w.pool ? "Kolam" : "Coach",
                holderName: w.pool?.name ?? w.coachProfile?.user.name ?? "-",
                holderContact: w.coachProfile?.user.phone ?? null,
                currentBalance: w.pool?.walletBalance ?? w.coachProfile?.walletBalance ?? 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Penarikan pendapatan SPH jarang dilakukan: dilipat di bawah supaya antrean
          penarikan kolam & coach (tugas harian) ada di atas. */}
      <details className="group mt-8 rounded-2xl border border-border bg-surface">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <span>
            <span className="block text-lg font-semibold text-text">Saldo Platform (SPH)</span>
            <span className="block text-sm text-text-muted">Bisa ditarik {formatRupiah(Math.max(0, platform.availableRevenue))} · PPN {formatRupiah(Math.max(0, platform.availableTax))}</span>
          </span>
          <span aria-hidden className="text-text-subtle transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <div>
            <p className="text-sm text-text-muted">
              Komisi platform dari setiap sesi, sudah dipisah dari PPN (11% sejak 30 Sep 2026, sebelumnya 12%). Dana sesi baru bisa ditarik setelah ditahan{" "}
              {PLATFORM_HOLD_DAYS} hari (masa member melapor). Catat di sini setiap kali saldo ditarik dari akun Midtrans, lengkap
              dengan bukti transfer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm text-text-muted">Pendapatan bersih bisa ditarik</p>
              <p className="text-2xl font-bold text-text">{formatRupiah(Math.max(0, platform.availableRevenue))}</p>
              {platform.pendingCommissions > 0 && (
                <p className="text-xs text-text-subtle">Sudah dikurangi komisi afiliasi tertunda {formatRupiah(platform.pendingCommissions)}</p>
              )}
              <p className="text-xs text-text-subtle">Total termasuk yang masih ditahan: {formatRupiah(platform.revenue)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm text-text-muted">Saldo PPN (untuk disetor ke negara)</p>
              <p className="text-2xl font-bold text-text">{formatRupiah(Math.max(0, platform.availableTax))}</p>
              <p className="text-xs text-text-subtle">Total termasuk yang masih ditahan: {formatRupiah(platform.tax)}</p>
            </div>
          </div>
          {/* Pembalikan (sesi Hadir yang dikoreksi) langsung mengurangi, kredit baru ditahan dulu --
              jadi angka "bisa ditarik" bisa sementara di bawah nol dan ditampilkan Rp0. */}
          <PlatformWithdrawForm revenue={platform.availableRevenue} tax={platform.availableTax} />
          {platformHistory.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold text-text">Penarikan terakhir</p>
              <ul className="flex flex-col divide-y divide-border text-sm">
                {platformHistory.map((h) => (
                  <li key={h.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                    <span className="text-text-muted">
                      {h.createdAt.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                      {h.transferReference ? ` · Ref ${h.transferReference}` : ""}
                      {h.note ? ` · ${h.note}` : ""}
                    </span>
                    <span className="text-text">
                      Pendapatan {formatRupiah(h.revenueAmount)} · Pajak {formatRupiah(h.taxAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </main>
  );
}

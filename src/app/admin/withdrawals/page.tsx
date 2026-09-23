import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import WithdrawalRow from "./withdrawal-row";
import PlatformWithdrawForm from "./platform-withdraw-form";
import { getPlatformBalance } from "@/lib/platform-wallet";
import { isIrisConfigured } from "@/lib/disbursement";

const STATUS_FILTERS = {
  waiting: { label: "Perlu diproses", statuses: ["PENDING", "PROCESSING"] },
  paid: { label: "Sudah ditransfer", statuses: ["PAID"] },
  failed: { label: "Gagal / ditolak", statuses: ["FAILED"] },
  all: { label: "Semua", statuses: ["PENDING", "PROCESSING", "PAID", "FAILED"] },
} as const;
type StatusKey = keyof typeof STATUS_FILTERS;

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
        ...(params.pool ? { poolId: params.pool } : {}),
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
    `rounded-full border px-3 py-1 text-sm ${active ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-border text-text hover:bg-surface-muted"}`;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Pencairan Saldo</h1>
      <p className="mt-1 text-sm text-text-muted">
        Permintaan tarik saldo dari kolam &amp; coach ke rekening mereka. Transfer manual lewat m-banking, lalu tandai
        dibayar. Pengajuan yang ditolak otomatis mengembalikan saldo.
      </p>

      <Card className="mt-4">
        <CardBody className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text">Saldo Platform</h2>
            <p className="text-sm text-text-muted">
              Komisi platform dari setiap sesi Hadir, sudah dipisah dari PPN 12%. Catat di sini setiap kali saldo ditarik dari
              akun Midtrans.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm text-text-muted">Pendapatan bersih bisa ditarik</p>
              <p className="text-2xl font-bold text-text">{formatRupiah(platform.revenue)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm text-text-muted">Saldo pajak (PPN 12%)</p>
              <p className="text-2xl font-bold text-text">{formatRupiah(platform.tax)}</p>
            </div>
          </div>
          <PlatformWithdrawForm revenue={platform.revenue} tax={platform.tax} />
          {platformHistory.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold text-text">Penarikan terakhir</p>
              <ul className="flex flex-col divide-y divide-border text-sm">
                {platformHistory.map((h) => (
                  <li key={h.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                    <span className="text-text-muted">
                      {h.createdAt.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
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
        </CardBody>
      </Card>

      <h2 className="mt-8 text-lg font-semibold text-text">Pencairan kolam &amp; coach</h2>
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
        <span className="ml-2 text-sm text-text-muted">Kolam:</span>
        <Link href={link({ pool: undefined })} className={chip(!params.pool)}>Semua</Link>
        {pools.map((p) => (
          <Link key={p.id} href={link({ pool: p.id, who: "pool" })} className={chip(params.pool === p.id)}>{p.name}</Link>
        ))}
      </div>

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
                processedAt: w.processedAt?.toISOString() ?? null,
                failureReason: w.failureReason,
                referenceId: w.midtransReferenceId,
                bankName: w.bankName,
                bankAccountNumber: w.bankAccountNumber,
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
    </main>
  );
}

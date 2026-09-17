import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import WithdrawalRow from "./withdrawal-row";

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

  const [requests, pools, totals] = await Promise.all([
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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Pencairan Saldo</h1>
      <p className="mt-1 text-sm text-text-muted">
        Permintaan tarik saldo dari kolam &amp; coach ke rekening mereka. Transfer manual lewat m-banking, lalu tandai
        dibayar. Pengajuan yang ditolak otomatis mengembalikan saldo.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {requests.map((w) => (
            <WithdrawalRow
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

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { todayWibDateString, wibDateTime } from "@/lib/datetime";

const statusTone = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
} as const;

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
};

function daysAgoWib(n: number): string {
  const today = new Date(`${todayWibDateString()}T00:00:00+07:00`);
  today.setDate(today.getDate() - n);
  return today.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function dateKeyWib(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function formatDateHeader(dateKey: string) {
  return wibDateTime(dateKey, "00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatTimeWib(d: Date) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export default async function AdminPembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const from = params.from || daysAgoWib(29);
  const to = params.to || todayWibDateString();

  const fromDateTime = wibDateTime(from, "00:00");
  const toDateTime = wibDateTime(to, "23:59");

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: fromDateTime, lte: toDateTime } },
    orderBy: { createdAt: "desc" },
    include: { package: { include: { member: { select: { name: true, email: true } } } } },
  });

  const byDate = new Map<string, typeof payments>();
  for (const p of payments) {
    const key = dateKeyWib(p.createdAt);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(p);
  }
  const sortedDateKeys = [...byDate.keys()].sort().reverse();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Riwayat Pembayaran</h1>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
            <Field label="Dari">
              <Input type="date" name="from" defaultValue={from} className="w-full sm:w-40" />
            </Field>
            <Field label="Sampai">
              <Input type="date" name="to" defaultValue={to} className="w-full sm:w-40" />
            </Field>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardBody>
      </Card>

      {payments.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada transaksi di rentang tanggal ini.</p>
          </CardBody>
        </Card>
      ) : (
        sortedDateKeys.map((key) => {
          const rows = byDate.get(key)!;
          return (
            <div key={key} className="mb-5">
              <h2 className="mb-2 text-sm font-semibold text-text-muted">{formatDateHeader(key)}</h2>

              {/* Desktop: tabel */}
              <Card className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                        <th className="px-4 py-3 font-medium">Jam</th>
                        <th className="px-4 py-3 font-medium">Member</th>
                        <th className="px-4 py-3 font-medium">Paket</th>
                        <th className="px-4 py-3 font-medium">Order ID</th>
                        <th className="px-4 py-3 font-medium">Jumlah</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-text-subtle">{formatTimeWib(p.createdAt)}</td>
                          <td className="px-4 py-3 text-text">
                            {p.package.member.name}
                            <span className="block text-xs text-text-subtle">
                              {p.package.member.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{p.package.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-text-subtle">
                            {p.midtransOrderId}
                          </td>
                          <td className="px-4 py-3 text-text">{formatRupiah(p.amount)}</td>
                          <td className="px-4 py-3">
                            <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Mobile: card */}
              <ul className="flex flex-col gap-2 sm:hidden">
                {rows.map((p) => (
                  <Card key={p.id}>
                    <CardBody className="flex flex-col gap-1.5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-text">{p.package.member.name}</p>
                          <p className="text-xs text-text-subtle">{p.package.member.email}</p>
                        </div>
                        <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                      </div>
                      <p className="text-sm text-text-muted">{p.package.name}</p>
                      <p className="font-mono text-xs text-text-subtle">{p.midtransOrderId}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text">{formatRupiah(p.amount)}</p>
                        <p className="text-xs text-text-subtle">{formatTimeWib(p.createdAt)}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </main>
  );
}

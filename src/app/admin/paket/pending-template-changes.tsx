import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { formatRupiah } from "@/lib/format";
import type { PendingTemplateChange } from "@/lib/package-template";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewTemplate } from "./actions";

const LABELS: [keyof PendingTemplateChange, string][] = [
  ["name", "Nama"],
  ["price", "Harga"],
  ["totalSesi", "Total sesi"],
  ["durationDays", "Berlaku (hari)"],
  ["jatahCancel", "Jatah batal"],
  ["isActive", "Dijual"],
];

function show(key: keyof PendingTemplateChange, v: unknown) {
  if (key === "price") return formatRupiah(v as number);
  if (key === "isActive") return v ? "Ya" : "Tidak";
  return String(v);
}

// Usulan paket baru / perubahan harga dari pemilik kolam.
export default async function PendingTemplateChanges() {
  const rows = await prisma.packageTemplate.findMany({
    where: { pendingChanges: { not: Prisma.DbNull } },
    orderBy: { pool: { name: "asc" } },
    select: { id: true, name: true, price: true, totalSesi: true, durationDays: true, jatahCancel: true, isActive: true, pendingChanges: true, pool: { select: { name: true } } },
  });
  const pending = rows.filter((r) => r.pendingChanges);
  if (pending.length === 0) return null;

  return (
    <Card className="mb-6 border-warning-text">
      <CardBody>
        <h2 className="mb-1 text-lg font-semibold text-text">Usulan paket dari pemilik kolam ({pending.length})</h2>
        <p className="mb-3 text-sm text-text-muted">Belum berlaku sampai disetujui. Paket yang sudah dibeli member tidak ikut berubah.</p>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pending.map((t) => {
            const p = t.pendingChanges as unknown as PendingTemplateChange;
            return (
              <li key={t.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-brand-700">{t.pool.name}</p>
                <p className="text-base font-semibold text-text">
                  {p.isNew ? "Paket baru" : "Perubahan"}: {p.name}
                </p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  {LABELS.map(([key, label]) => {
                    const before = (t as unknown as Record<string, unknown>)[key];
                    const after = p[key];
                    const changed = p.isNew || before !== after;
                    return (
                      <div key={key} className="contents">
                        <dt className="text-text-muted">{label}</dt>
                        <dd className={changed ? "font-semibold text-text" : "text-text-muted"}>
                          {!p.isNew && changed ? `${show(key, before)} → ${show(key, after)}` : show(key, after)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="mt-3 flex gap-2">
                  <form action={reviewTemplate.bind(null, t.id, true)}>
                    <Button type="submit" size="sm">Setujui</Button>
                  </form>
                  <form action={reviewTemplate.bind(null, t.id, false)}>
                    <Button type="submit" size="sm" variant="danger">Tolak</Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import {
  createTemplate,
  updateTemplate,
  assignPackageToMember,
  updatePackage,
} from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from "@/lib/datetime";

const statusTone = {
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
} as const;

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function toInputDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function memberSince(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default async function AdminPaketPage() {
  await requireRole("ADMIN");

  const [members, templates, packages] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.packageTemplate.findMany({ orderBy: { totalSesi: "asc" } }),
    prisma.package.findMany({
      orderBy: { createdAt: "desc" },
      include: { member: { select: { name: true, email: true, createdAt: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola Paket</h1>

      {/* --- Katalog Paket --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Katalog Paket</h2>
      <p className="mb-3 text-sm text-text-muted">
        Paket generik, gak ditujukan ke member manapun -- ini yang muncul di halaman
        &ldquo;Beli Paket&rdquo; member.
      </p>

      <Card className="mb-4">
        <CardBody>
          <form action={createTemplate} className="flex flex-wrap items-end gap-3">
            <Field label="Nama Paket">
              <Input name="name" required className="w-44" />
            </Field>
            <Field label="Total Sesi">
              <Input type="number" name="totalSesi" required min={1} className="w-24" />
            </Field>
            <Field label="Harga (Rp)">
              <Input type="number" name="price" required min={0} className="w-32" />
            </Field>
            <Button type="submit">Tambah Katalog</Button>
          </form>
        </CardBody>
      </Card>

      <ul className="mb-8 flex flex-col gap-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardBody>
              <form action={updateTemplate} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="templateId" value={t.id} />
                <Field label="Nama">
                  <Input name="name" defaultValue={t.name} className="w-40" />
                </Field>
                <Field label="Total Sesi">
                  <Input type="number" name="totalSesi" defaultValue={t.totalSesi} min={1} className="w-20" />
                </Field>
                <Field label="Harga (Rp)">
                  <Input type="number" name="price" defaultValue={t.price} min={0} className="w-32" />
                </Field>
                <div className="flex items-center gap-1.5 pb-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    id={`active-${t.id}`}
                    defaultChecked={t.isActive}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor={`active-${t.id}`} className="text-sm text-text">
                    Aktif
                  </Label>
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Simpan
                </Button>
              </form>
            </CardBody>
          </Card>
        ))}
      </ul>

      {/* --- Assign paket khusus ke member --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Assign Paket ke Member</h2>
      <p className="mb-3 text-sm text-text-muted">
        Buat paket khusus buat 1 member tertentu (koreksi, promo, atau kasus di luar
        alur beli-online).
      </p>

      <Card className="mb-8">
        <CardBody>
          <form action={assignPackageToMember} className="flex flex-wrap items-end gap-3">
            <Field label="Member">
              <Select name="memberId" required className="w-52">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dari Katalog (opsional)">
              <Select name="templateId" className="w-44" defaultValue="">
                <option value="">-- custom --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nama Paket">
              <Input name="name" required className="w-40" />
            </Field>
            <Field label="Total Sesi">
              <Input type="number" name="totalSesi" required min={1} className="w-20" />
            </Field>
            <Field label="Berlaku Sampai (opsional)">
              <Input type="date" name="expiredDate" className="w-40" />
            </Field>
            <Button type="submit">Assign (langsung Aktif)</Button>
          </form>
        </CardBody>
      </Card>

      {/* --- List member + paket, advanced --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Paket per Member</h2>
      <ul className="flex flex-col gap-3">
        {packages.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text">
                  {p.member.name} <span className="text-text-subtle">({p.member.email})</span>
                </p>
                <p className="text-xs text-text-subtle">
                  Member sejak {memberSince(p.member.createdAt)}
                </p>
                <p className="mb-3 mt-1 text-sm text-text-muted">{p.name}</p>

                <form action={updatePackage} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="packageId" value={p.id} />
                  <Field label="Sisa Sesi">
                    <Input
                      type="number"
                      name="sisaSesi"
                      defaultValue={p.sisaSesi}
                      min={0}
                      max={p.totalSesi}
                      className="w-20"
                    />
                  </Field>
                  <Field label="Status">
                    <Select name="status" defaultValue={p.status} className="w-44">
                      <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
                      <option value="ACTIVE">Aktif</option>
                      <option value="EXPIRED">Kedaluwarsa</option>
                    </Select>
                  </Field>
                  <Field label="Berlaku Sampai">
                    <Input
                      type="date"
                      name="expiredDate"
                      defaultValue={toInputDate(p.expiredDate)}
                      className="w-40"
                    />
                  </Field>
                  <Button type="submit" variant="secondary" size="sm">
                    Simpan
                  </Button>
                </form>
              </div>

              <div className="shrink-0 rounded-lg bg-surface-muted px-4 py-3 sm:text-right">
                <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                <p className="mt-2 text-sm font-semibold text-text">
                  {p.sisaSesi}/{p.totalSesi} sesi
                </p>
                <p className="text-xs text-text-subtle">
                  {p.expiredDate
                    ? `Berlaku s.d. ${formatDateLabel(p.expiredDate)}`
                    : "Gak ada batas waktu"}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </ul>
    </main>
  );
}

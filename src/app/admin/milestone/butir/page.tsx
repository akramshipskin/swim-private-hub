import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { MILESTONE_GROUPS, MILESTONE_GROUP_LABEL, levelsOf } from "@/lib/milestone";
import { setStandardItemActive } from "../actions";
import { AddItemForm, EditItemForm } from "./item-forms";

export const metadata = { title: "Butir Standar Milestone | Swim Private Hub" };

export default async function StandardItemsPage() {
  await requireRole("ADMIN");
  const items = await prisma.milestoneItem.findMany({
    where: { dependentId: null },
    orderBy: [{ group: "asc" }, { level: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, group: true, level: true, sortOrder: true, text: true, isActive: true },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <Link href="/admin/milestone" className="text-sm text-brand-700 hover:underline">← Milestone</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Butir Standar Milestone</h1>
      <p className="mt-1 text-sm text-text-muted">
        Berlaku untuk semua peserta di kelompok & level itu. Butir yang dinonaktifkan tidak dihitung lagi; level yang
        sudah selesai dan sertifikatnya tidak berubah. Butir tidak bisa dipindah kelompok/level supaya progres peserta
        tidak teracak. Untuk memindahkan, nonaktifkan lalu tambah butir baru.
      </p>

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-3 text-lg font-semibold text-text">Tambah butir</h2>
          <AddItemForm />
        </CardBody>
      </Card>

      {MILESTONE_GROUPS.map((g) => (
        <Card key={g} className="mt-4">
          <CardBody>
            <h2 className="text-lg font-semibold text-text">Kelompok {g}</h2>
            <p className="mb-3 text-sm text-text-muted">{MILESTONE_GROUP_LABEL[g]}</p>
            {levelsOf(items, g).length === 0 ? (
              <p className="text-sm text-text-muted">Belum ada butir.</p>
            ) : (
              levelsOf(items, g).map((l) => (
                <div key={l.level} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-sm font-semibold text-text">Level {l.level}</h3>
                  <ul className="flex flex-col gap-2">
                    {l.items.map((it) => (
                      <li key={it.id} className={`flex flex-col gap-2 sm:flex-row sm:items-start ${it.isActive ? "" : "opacity-60"}`}>
                        <EditItemForm id={it.id} text={it.text} sortOrder={it.sortOrder} />
                        {it.isActive ? (
                          <ConfirmSubmit
                            action={setStandardItemActive.bind(null, it.id, false)}
                            label="Nonaktifkan"
                            variant="danger"
                            title="Nonaktifkan butir?"
                            description={`"${it.text}" tidak dihitung lagi. Peserta yang tinggal kurang butir ini naik level di catatan coach berikutnya.`}
                            confirmLabel="Ya, Nonaktifkan"
                          />
                        ) : (
                          <ConfirmSubmit
                            action={setStandardItemActive.bind(null, it.id, true)}
                            label="Aktifkan"
                            title="Aktifkan lagi?"
                            description={`"${it.text}" dihitung lagi untuk level yang belum selesai.`}
                            confirmLabel="Ya, Aktifkan"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ))}
    </main>
  );
}

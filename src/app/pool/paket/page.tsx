import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CreateTemplateForm from "@/app/admin/paket/create-template-form";
import TemplateEditForm from "@/app/admin/paket/template-edit-form";
import { createPoolTemplate, updatePoolTemplate } from "./actions";
import { formatRupiah } from "@/lib/format";
import type { PendingTemplateChange } from "@/lib/package-template";

export default async function PoolPaketPage() {
  const session = await requireRole("POOL_OWNER");
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      packageTemplates: { orderBy: { totalSesi: "asc" } },
    },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Paket &amp; Harga</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Usulkan paket baru atau perubahan harga untuk kolammu. Usulan berlaku setelah disetujui admin; paket yang sudah
        dibeli member tidak ikut berubah.
      </p>
      {pools.length === 0 ? (
        <p className="text-sm text-text-muted">Akun ini belum terhubung ke kolam mana pun. Hubungi admin.</p>
      ) : (
        <>
          <CreateTemplateForm pools={pools.map((p) => ({ id: p.id, name: p.name }))} action={createPoolTemplate} submitLabel="Kirim Usulan" />
          <div className="mt-6 flex flex-col gap-6">
            {pools.map((p) => (
              <section key={p.id}>
                <h2 className="mb-2 text-lg font-semibold text-brand-700">{p.name}</h2>
                {p.packageTemplates.length === 0 ? (
                  <p className="text-sm text-text-muted">Belum ada paket. Tambah lewat form di atas.</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {p.packageTemplates.map((t) => (
                      <li key={t.id}>
                        {t.pendingChanges && (
                          <p className="mb-2 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
                            {(t.pendingChanges as unknown as PendingTemplateChange).isNew ? "Paket baru" : "Perubahan"} menunggu
                            persetujuan admin: {(t.pendingChanges as unknown as PendingTemplateChange).name} ·{" "}
                            {formatRupiah((t.pendingChanges as unknown as PendingTemplateChange).price)}. Yang tampil di bawah adalah
                            yang sedang berlaku.
                          </p>
                        )}
                        <TemplateEditForm template={t} action={updatePoolTemplate} submitLabel="Kirim Usulan" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

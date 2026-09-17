import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CreateTemplateForm from "@/app/admin/paket/create-template-form";
import TemplateEditForm from "@/app/admin/paket/template-edit-form";
import { createPoolTemplate, updatePoolTemplate } from "./actions";

export default async function PoolPaketPage() {
  const session = await requireRole("POOL_OWNER");
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      packageTemplates: { orderBy: { totalSesi: "asc" }, include: { pool: { select: { name: true } } } },
    },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Paket &amp; Harga</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Atur katalog paket yang dijual di kolammu. Perubahan harga langsung berlaku untuk pembelian berikutnya; paket yang
        sudah dibeli member tidak berubah.
      </p>
      {pools.length === 0 ? (
        <p className="text-sm text-text-muted">Akun ini belum terhubung ke kolam mana pun. Hubungi admin.</p>
      ) : (
        <>
          <CreateTemplateForm pools={pools.map((p) => ({ id: p.id, name: p.name }))} action={createPoolTemplate} />
          <div className="mt-6 flex flex-col gap-6">
            {pools.map((p) => (
              <section key={p.id}>
                <h2 className="mb-2 text-lg font-semibold text-brand-700">{p.name}</h2>
                {p.packageTemplates.length === 0 ? (
                  <p className="text-sm text-text-muted">Belum ada paket. Tambah lewat form di atas.</p>
                ) : (
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {p.packageTemplates.map((t) => (
                      <li key={t.id}>
                        <TemplateEditForm template={t} action={updatePoolTemplate} />
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

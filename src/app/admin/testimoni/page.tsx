import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { deleteTestimonial, setTestimonialPublished } from "./actions";
import { AddTestimonialForm, EditTestimonialForm } from "./forms";

export const metadata = { title: "Testimoni | Swim Private Hub" };

export default async function AdminTestimonialsPage() {
  await requireRole("ADMIN");
  const items = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const shown = items.filter((t) => t.isPublished).length;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Testimoni</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tampil di landing pada bagian &quot;Kata mereka&quot;. Hanya isi testimoni ASLI dengan izin yang bersangkutan
        (catat izinnya). Testimoni baru disembunyikan dulu; periksa lalu tekan Tampilkan. Bagian itu otomatis tersembunyi kalau tidak ada yang berstatus tampil.{" "}
        {shown === 0 ? "Sekarang: tersembunyi." : `Sekarang: ${shown} testimoni tampil.`}
      </p>

      <details className="group mt-6 rounded-2xl border border-border bg-surface">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-text">
          Tambah Testimoni
          <span aria-hidden className="text-text-subtle transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-border p-4">
          <AddTestimonialForm />
        </div>
      </details>

      {items.map((t) => (
        // Tiap testimoni dilipat: ringkasan nama, status, dan awal kutipan; formulir
        // ubah baru tampil saat dibuka (dulu semua formulir terbuka sekaligus).
        <details key={t.id} className={`group mt-4 rounded-2xl border border-border bg-surface ${t.isPublished ? "" : "opacity-80"}`}>
          <summary className="flex min-h-[44px] cursor-pointer list-none items-start justify-between gap-3 px-4 py-4">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-text">{t.name}</span>
                <Badge tone={t.isPublished ? "success" : "neutral"}>{t.isPublished ? "Tampil" : "Disembunyikan"}</Badge>
              </span>
              <span className="mt-0.5 line-clamp-1 block text-sm text-text-muted">&ldquo;{t.quote}&rdquo;</span>
            </span>
            <span aria-hidden className="mt-1 text-text-subtle transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-border p-4">
            <EditTestimonialForm
              id={t.id}
              values={{ name: t.name, role: t.role, quote: t.quote, consentNote: t.consentNote, sortOrder: t.sortOrder }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <ConfirmSubmit
                action={setTestimonialPublished.bind(null, t.id, !t.isPublished)}
                label={t.isPublished ? "Sembunyikan" : "Tampilkan"}
                title={t.isPublished ? "Sembunyikan dari landing?" : "Tampilkan di landing?"}
                description={t.isPublished ? "Testimoni ini tidak tampil lagi, datanya tetap tersimpan." : "Testimoni ini langsung tampil di landing publik."}
                confirmLabel={t.isPublished ? "Ya, sembunyikan" : "Ya, tampilkan"}
              />
              <ConfirmSubmit
                action={deleteTestimonial.bind(null, t.id)}
                label="Hapus"
                variant="danger"
                title="Hapus testimoni?"
                description={`Testimoni ${t.name} dihapus permanen, termasuk catatan izinnya.`}
                confirmLabel="Ya, Hapus"
              />
            </div>
          </div>
        </details>
      ))}
    </main>
  );
}

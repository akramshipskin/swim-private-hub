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

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-3 text-lg font-semibold text-text">Tambah testimoni</h2>
          <AddTestimonialForm />
        </CardBody>
      </Card>

      {items.map((t) => (
        <Card key={t.id} className={`mt-4 ${t.isPublished ? "" : "opacity-70"}`}>
          <CardBody>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-text">{t.name}</h2>
              <Badge tone={t.isPublished ? "success" : "neutral"}>{t.isPublished ? "Tampil" : "Disembunyikan"}</Badge>
            </div>
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
                confirmLabel="Ya, hapus"
              />
            </div>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}

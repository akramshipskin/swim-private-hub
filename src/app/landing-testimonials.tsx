// Testimoni ASLI dari pengguna nyata (dengan izin mereka), diambil dari tabel
// Testimonial (dikelola di /admin/testimoni). Bagian "Kata mereka" otomatis
// tersembunyi kalau tidak ada yang tampil. Jangan mengisi contoh/dummy --
// bagian ini tampil ke publik dan ke calon pelanggan dari iklan.
export type Testimonial = { name: string; role: string; quote: string };

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section id="testimoni" className="mx-auto w-full max-w-6xl scroll-mt-36 md:scroll-mt-20 px-4 pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kata mereka</h2>
      </div>
      <ul className="grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <li key={`${t.name}-${t.role}`} className="flex flex-col gap-4 rounded-3xl bg-white p-8">
            <blockquote className="text-base text-fixed-ink">“{t.quote}”</blockquote>
            <p className="mt-auto text-sm">
              <span className="font-semibold text-fixed-ink">{t.name}</span>
              <span className="text-fixed-muted"> · {t.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
